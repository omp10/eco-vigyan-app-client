import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
  ActivityIndicator,
  ScrollView,
  Image as RNImage,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Location from 'expo-location';
import { trailService } from '../services/api';
import { mapService, LatLng } from '../services/mapService';
import { getAppTheme, shadows } from '@/constants/app-theme';
import { useTheme } from '@/context/ThemeContext';
import { Image as ExpoImage } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';

const { height } = Dimensions.get('window');

const OFF_ROUTE_THRESHOLD_METERS = 45;
const AUTO_ADVANCE_THRESHOLD_METERS = 24;
const LEG_REROUTE_DISTANCE_METERS = 18;
const LEG_REROUTE_INTERVAL_MS = 8000;
const WALKING_METERS_PER_SECOND = 1.35;

const mapStyles = {
  light: [
    { featureType: 'poi', stylers: [{ visibility: 'off' }] },
    { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#f5faf5' }] },
    { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  ],
  dark: [
    { featureType: 'all', elementType: 'geometry', stylers: [{ color: '#172018' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0d1410' }] },
    { featureType: 'poi', stylers: [{ visibility: 'off' }] },
    { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  ],
};

const getDist = (l1: LatLng, l2: LatLng) => {
  const R = 6371e3;
  const p1 = (l1.latitude * Math.PI) / 180;
  const p2 = (l2.latitude * Math.PI) / 180;
  const dP = ((l2.latitude - l1.latitude) * Math.PI) / 180;
  const dL = ((l2.longitude - l1.longitude) * Math.PI) / 180;
  const a =
    Math.sin(dP / 2) ** 2 +
    Math.cos(p1) * Math.cos(p2) * Math.sin(dL / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const pathDistance = (points: LatLng[]) => {
  if (points.length < 2) return 0;
  return points.slice(1).reduce((sum, point, index) => sum + getDist(points[index], point), 0);
};

const parseDurationToSeconds = (duration?: string) => {
  if (!duration) return null;
  const seconds = Number.parseFloat(duration.replace('s', ''));
  return Number.isFinite(seconds) ? seconds : null;
};

const formatDistance = (meters: number | null) => {
  if (meters === null) return '--';
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(meters < 10000 ? 1 : 0)} km`;
};

const formatMinutes = (seconds: number | null) => {
  if (seconds === null) return '--';
  const minutes = Math.max(1, Math.round(seconds / 60));
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} hr` : `${hours} hr ${rest} min`;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const toLocalXY = (point: LatLng, anchorLat: number) => {
  const metersPerDegLat = 111320;
  const metersPerDegLon = metersPerDegLat * Math.cos((anchorLat * Math.PI) / 180);
  return {
    x: point.longitude * metersPerDegLon,
    y: point.latitude * metersPerDegLat,
  };
};

const getPathProgress = (point: LatLng, path: LatLng[]) => {
  if (path.length < 2) {
    return { alongMeters: 0, totalMeters: 0, distanceToPath: 0 };
  }

  const totalMeters = pathDistance(path);
  let bestDistance = Number.POSITIVE_INFINITY;
  let bestAlongMeters = 0;
  let traversedMeters = 0;

  for (let i = 0; i < path.length - 1; i += 1) {
    const start = path[i];
    const end = path[i + 1];
    const segmentMeters = getDist(start, end);
    const anchorLat = (start.latitude + end.latitude + point.latitude) / 3;
    const a = toLocalXY(start, anchorLat);
    const b = toLocalXY(end, anchorLat);
    const p = toLocalXY(point, anchorLat);
    const abx = b.x - a.x;
    const aby = b.y - a.y;
    const abSquared = abx * abx + aby * aby || 1;
    const apx = p.x - a.x;
    const apy = p.y - a.y;
    const t = clamp((apx * abx + apy * aby) / abSquared, 0, 1);
    const closest = { x: a.x + abx * t, y: a.y + aby * t };
    const distance = Math.hypot(p.x - closest.x, p.y - closest.y);

    if (distance < bestDistance) {
      bestDistance = distance;
      bestAlongMeters = traversedMeters + segmentMeters * t;
    }

    traversedMeters += segmentMeters;
  }

  return { alongMeters: bestAlongMeters, totalMeters, distanceToPath: bestDistance };
};

type FollowMode = 'heading' | 'north';

export default function ActiveTrailScreen() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const colors = getAppTheme(theme).colors;
  const params = useLocalSearchParams();
  const mapRef = useRef<MapView>(null);
  const locationSub = useRef<Location.LocationSubscription | null>(null);
  const lastLegFetchRef = useRef<{ at: number; loc: LatLng | null; stop: number | null }>({
    at: 0,
    loc: null,
    stop: null,
  });

  const [trail, setTrail] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeStop, setActiveStop] = useState(0);
  const [userLoc, setUserLoc] = useState<LatLng | null>(null);
  const [navStarted, setNavStarted] = useState(false);
  const [followMode, setFollowMode] = useState<FollowMode>('heading');
  const [routeCoords, setRouteCoords] = useState<LatLng[]>([]);
  const [activeLegCoords, setActiveLegCoords] = useState<LatLng[]>([]);
  const [userToStartCoords, setUserToStartCoords] = useState<LatLng[]>([]);
  const [traveledCoords, setTraveledCoords] = useState<LatLng[]>([]);
  const [metersToNext, setMetersToNext] = useState<number | null>(null);
  const [remainingMeters, setRemainingMeters] = useState<number | null>(null);
  const [completedMeters, setCompletedMeters] = useState<number>(0);
  const [activeLegDurationSeconds, setActiveLegDurationSeconds] = useState<number | null>(null);
  const [offRoute, setOffRoute] = useState(false);
  const [arrivedAtStop, setArrivedAtStop] = useState(false);
  const [progressExpanded, setProgressExpanded] = useState(false);
  const [navCardExpanded, setNavCardExpanded] = useState(false);
  const [progressBaselineMeters, setProgressBaselineMeters] = useState<number>(0);

  const currentMushroom = trail?.mushrooms?.[activeStop] ?? null;
  const totalRouteMeters = useMemo(() => {
    if (routeCoords.length > 1) return pathDistance(routeCoords);
    return pathDistance((trail?.mushrooms || []).map((m: any) => m.location));
  }, [routeCoords, trail]);

  const effectiveRouteMeters = useMemo(() => {
    return Math.max(totalRouteMeters - progressBaselineMeters, 0);
  }, [totalRouteMeters, progressBaselineMeters]);

  const progressRatio = useMemo(() => {
    if (!effectiveRouteMeters) return 0;
    return clamp(completedMeters / effectiveRouteMeters, 0, 1);
  }, [completedMeters, effectiveRouteMeters]);

  useEffect(() => {
    loadTrail();
    initLocation();
    return () => {
      locationSub.current?.remove();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!trail || !userLoc) return;

    if (!navStarted) {
      updateGuideToStart();
      refreshProgressMetrics(userLoc);
      return;
    }

    refreshProgressMetrics(userLoc);
    appendTravelPoint(userLoc);
    refreshActiveLegRoute(userLoc);
    if (followMode === 'heading') {
      focusOnUser(userLoc, 'heading');
    }
  }, [trail, userLoc, navStarted, activeStop, followMode]); // eslint-disable-line react-hooks/exhaustive-deps

  const initLocation = async () => {
    const currentPermission = await Location.getForegroundPermissionsAsync();
    let status = currentPermission.status;

    if (status !== 'granted') {
      const requested = await Location.requestForegroundPermissionsAsync();
      status = requested.status;
    }

    if (status !== 'granted') {
      Alert.alert('Location needed', 'Turn on location to follow the trail.');
      setLoading(false);
      return;
    }

    const current = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    setUserLoc(current.coords);

    locationSub.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Balanced,
        distanceInterval: 8,
        timeInterval: 4000,
      },
      (loc) => setUserLoc(loc.coords)
    );
  };

  const loadTrail = async () => {
    try {
      setLoading(true);
      let nextTrail = params.trailData ? JSON.parse(params.trailData as string) : null;
      if (!nextTrail && params.trailId) {
        const list = await trailService.getAllTrails();
        nextTrail = list.find((item: any) => item._id === params.trailId);
      }

      if (!nextTrail) {
        router.back();
        return;
      }

      setTrail(nextTrail);
      const points = nextTrail.mushrooms.map((item: any) => item.location);

      if (points.length > 1) {
        try {
          const route = await mapService.fetchRoute(
            points[0],
            points[points.length - 1],
            points.slice(1, -1)
          );
          setRouteCoords(route?.polyline?.length ? route.polyline : points);
        } catch {
          setRouteCoords(points);
        }
      } else {
        setRouteCoords(points);
      }
    } finally {
      setLoading(false);
    }
  };

  const appendTravelPoint = (loc: LatLng) => {
    setTraveledCoords((prev) => {
      const last = prev[prev.length - 1];
      if (last && getDist(last, loc) < 4) return prev;
      const next = [...prev, loc];
      return next.length > 180 ? next.slice(next.length - 180) : next;
    });
  };

  const updateGuideToStart = async () => {
    if (!userLoc || !trail || activeStop > 0) {
      setUserToStartCoords([]);
      return;
    }

    try {
      const startPoint = trail.mushrooms[0].location;
      const route = await mapService.fetchRoute(userLoc, startPoint, []);
      setUserToStartCoords(route?.polyline?.length ? route.polyline : [userLoc, startPoint]);
    } catch {
      setUserToStartCoords([userLoc, trail.mushrooms[0].location]);
    }
  };

  const refreshProgressMetrics = (loc: LatLng) => {
    if (!trail || !currentMushroom) return;

    const nextMeters = getDist(loc, currentMushroom.location);
    setMetersToNext(nextMeters);
    setArrivedAtStop(nextMeters <= AUTO_ADVANCE_THRESHOLD_METERS);

    if (routeCoords.length > 1) {
      const progress = getPathProgress(loc, routeCoords);
      const coveredMeters = Math.max(progress.alongMeters - progressBaselineMeters, 0);
      const routeRemainingMeters = Math.max(progress.totalMeters - progress.alongMeters, 0);
      setCompletedMeters(coveredMeters);
      setRemainingMeters(routeRemainingMeters);
      setOffRoute(progress.distanceToPath > OFF_ROUTE_THRESHOLD_METERS);
      return;
    }

    const fallbackDistance = pathDistance((trail.mushrooms || []).map((m: any) => m.location));
    const directRemaining = pathDistance([
      loc,
      ...trail.mushrooms.slice(activeStop).map((m: any) => m.location),
    ]);
    setCompletedMeters(Math.max(fallbackDistance - directRemaining, 0));
    setRemainingMeters(directRemaining);
    setOffRoute(false);
  };

  const nextDurationFromDistance = (meters: number) => meters / WALKING_METERS_PER_SECOND;

  const refreshActiveLegRoute = async (loc: LatLng) => {
    if (!trail || !currentMushroom) return;

    const now = Date.now();
    const lastFetch = lastLegFetchRef.current;
    const sameStop = lastFetch.stop === activeStop;
    const movedEnough = !lastFetch.loc || getDist(lastFetch.loc, loc) >= LEG_REROUTE_DISTANCE_METERS;
    const cooldownPassed = now - lastFetch.at >= LEG_REROUTE_INTERVAL_MS;

    if (sameStop && (!movedEnough || !cooldownPassed)) return;

    lastLegFetchRef.current = { at: now, loc, stop: activeStop };

    try {
      const route = await mapService.fetchRoute(loc, currentMushroom.location, []);
      if (!route) {
        setActiveLegCoords([loc, currentMushroom.location]);
        setActiveLegDurationSeconds(nextDurationFromDistance(getDist(loc, currentMushroom.location)));
        return;
      }

      setActiveLegCoords(route.polyline?.length ? route.polyline : [loc, currentMushroom.location]);
      setActiveLegDurationSeconds(
        parseDurationToSeconds(route.duration) ?? nextDurationFromDistance(route.distanceMeters)
      );
      setMetersToNext(route.distanceMeters ?? getDist(loc, currentMushroom.location));
    } catch {
      const fallbackMeters = getDist(loc, currentMushroom.location);
      setActiveLegCoords([loc, currentMushroom.location]);
      setActiveLegDurationSeconds(nextDurationFromDistance(fallbackMeters));
    }
  };

  const focusOnUser = (loc = userLoc, mode = followMode) => {
    if (!mapRef.current || !loc) return;
    mapRef.current.animateCamera(
      {
        center: loc,
        pitch: navStarted ? 58 : 0,
        zoom: navStarted ? 18 : 16.2,
        heading: mode === 'heading' ? ((loc as LatLng & { heading?: number }).heading || 0) : 0,
        altitude: 400,
      },
      { duration: 700 }
    );
  };

  const focusOverview = () => {
    if (!mapRef.current || !trail) return;
    const coordinates = [
      ...(userLoc ? [userLoc] : []),
      ...trail.mushrooms.map((item: any) => item.location),
      ...routeCoords,
    ];

    if (!coordinates.length) return;

    mapRef.current.fitToCoordinates(coordinates, {
      edgePadding: { top: 140, right: 80, bottom: 260, left: 80 },
      animated: true,
    });
  };

  const toggleFollow = () => {
    const nextMode: FollowMode = followMode === 'heading' ? 'north' : 'heading';
    setFollowMode(nextMode);
    focusOnUser(userLoc, nextMode);
  };

  const startNavigationFlow = async () => {
    locationSub.current?.remove();
    setNavStarted(true);
    setTraveledCoords(userLoc ? [userLoc] : []);
    setFollowMode('heading');
    setCompletedMeters(0);
    setRemainingMeters(totalRouteMeters || null);

    if (userLoc && routeCoords.length > 1) {
      const startProgress = getPathProgress(userLoc, routeCoords);
      setProgressBaselineMeters(startProgress.alongMeters);
      setRemainingMeters(Math.max(startProgress.totalMeters - startProgress.alongMeters, 0));
    } else {
      setProgressBaselineMeters(0);
    }

    locationSub.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        distanceInterval: 4,
        timeInterval: 2000,
      },
      (loc) => setUserLoc(loc.coords)
    );

    if (userLoc) {
      focusOnUser(userLoc, 'heading');
      refreshActiveLegRoute(userLoc);
    }
  };

  const goToStop = (index: number) => {
    if (!trail) return;
    setActiveStop(index);
    setArrivedAtStop(false);
    lastLegFetchRef.current = { at: 0, loc: null, stop: null };
    mapRef.current?.animateCamera(
      {
        center: trail.mushrooms[index].location,
        zoom: 18,
      },
      { duration: 700 }
    );
  };

  const markCurrentStopDone = () => {
    if (!trail) return;
    if (activeStop < trail.mushrooms.length - 1) {
      goToStop(activeStop + 1);
      return;
    }

    Alert.alert('Trail Finished', 'You completed the trail.', [
      { text: 'Close', onPress: () => router.back() },
    ]);
  };

  if (loading || !trail) {
    return <ActivityIndicator size="large" style={styles.center} color={colors.primary} />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        customMapStyle={theme === 'dark' ? mapStyles.dark : mapStyles.light}
        initialRegion={{
          latitude: trail.mushrooms[0].location.latitude,
          longitude: trail.mushrooms[0].location.longitude,
          latitudeDelta: 0.015,
          longitudeDelta: 0.015,
        }}
        showsUserLocation
        followsUserLocation={false}
        showsCompass={false}
        rotateEnabled
      >
        {routeCoords.length > 1 && (
          <Polyline
            coordinates={routeCoords}
            strokeWidth={7}
            strokeColor={colors.primary}
            lineCap="round"
            lineJoin="round"
            zIndex={20}
          />
        )}

        {navStarted && traveledCoords.length > 1 && (
          <Polyline
            coordinates={traveledCoords}
            strokeWidth={6}
            strokeColor="#2B7FFF"
            lineCap="round"
            lineJoin="round"
            zIndex={50}
          />
        )}

        {navStarted && activeLegCoords.length > 1 && (
          <Polyline
            coordinates={activeLegCoords}
            strokeWidth={5}
            strokeColor={colors.accent}
            lineCap="round"
            lineJoin="round"
            lineDashPattern={offRoute ? [10, 10] : undefined}
            zIndex={60}
          />
        )}

        {!navStarted && userToStartCoords.length > 1 && (
          <Polyline
            coordinates={userToStartCoords}
            strokeWidth={4}
            strokeColor={colors.accent}
            lineDashPattern={[6, 8]}
            zIndex={70}
          />
        )}

        {trail.mushrooms.map((m: any, i: number) => {
          const active = i === activeStop;
          const done = i < activeStop;

          return (
            <Marker
              key={m._id || i}
              coordinate={m.location}
              zIndex={active ? 200 : 120 + i}
              anchor={{ x: 0.5, y: 0.5 }}
              onPress={() => goToStop(i)}
            >
              <View
                style={[
                  styles.pinCard,
                  active && {
                    borderColor: colors.primary,
                    borderWidth: 2,
                    transform: [{ scale: 1.06 }],
                  },
                ]}
              >
                <RNImage
                  source={{ uri: m.images?.[0]?.url || m.thumbnail }}
                  style={styles.pinImage}
                  resizeMode="cover"
                />
                {done && (
                  <View style={[styles.pinDone, { backgroundColor: colors.primary }]}>
                    <Ionicons name="checkmark" size={16} color="#fff" />
                  </View>
                )}
                <View
                  style={[
                    styles.pinFooter,
                    { backgroundColor: active ? colors.primary : 'rgba(255,255,255,0.95)' },
                  ]}
                >
                  <Text
                    style={[
                      styles.pinFooterText,
                      { color: active ? '#fff' : colors.text },
                    ]}
                    numberOfLines={1}
                  >
                    {m.commonName}
                  </Text>
                </View>
                <View
                  style={[
                    styles.badgeIndex,
                    {
                      backgroundColor: active ? colors.primary : colors.surface,
                      borderColor: '#fff',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeIndexText,
                      { color: active ? '#fff' : colors.text },
                    ]}
                  >
                    {i + 1}
                  </Text>
                </View>
              </View>
            </Marker>
          );
        })}
      </MapView>

      <SafeAreaView style={styles.topHeader} edges={['top']} pointerEvents="box-none">
        <View style={[styles.headerCard, { backgroundColor: colors.surface }]}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.iconBox, { backgroundColor: colors.surfaceMuted }]}
          >
            <Ionicons name="close-outline" size={24} color={colors.text} />
          </TouchableOpacity>

          <View style={styles.headerTitleBlock}>
            <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
              {trail.name}
            </Text>
            <Text style={[styles.headerSub, { color: colors.textMuted }]}>
              Navigate | Stop {activeStop + 1} of {trail.mushrooms.length}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.iconBox, { backgroundColor: colors.surfaceMuted }]}
            onPress={toggleTheme}
          >
            <Ionicons
              name={theme === 'dark' ? 'sunny' : 'moon'}
              size={20}
              color={colors.text}
            />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <View
        style={[
          styles.mapControls,
          navStarted ? styles.mapControlsNavStarted : styles.mapControlsDefault,
        ]}
        pointerEvents="box-none"
      >
        <View style={styles.mapControlsStack}>
          <TouchableOpacity
            style={[styles.mapControlButton, { backgroundColor: colors.surface }]}
            onPress={() => focusOnUser()}
          >
            <Ionicons name="locate" size={20} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.mapControlButton, { backgroundColor: colors.surface }]}
            onPress={toggleFollow}
          >
            <Ionicons
              name={followMode === 'heading' ? 'compass' : 'navigate'}
              size={20}
              color={colors.text}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.mapControlButton, { backgroundColor: colors.surface }]}
            onPress={focusOverview}
          >
            <Ionicons name="scan" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {navStarted && (
        <View style={styles.leftProgressDock} pointerEvents="box-none">
          <TouchableOpacity
            style={[
              styles.progressToggle,
              { backgroundColor: colors.surface, borderColor: colors.surfaceMuted },
            ]}
            onPress={() => setProgressExpanded((value) => !value)}
          >
            <Ionicons
              name={progressExpanded ? 'chevron-back' : 'stats-chart'}
              size={18}
              color={colors.text}
            />
            {!progressExpanded && (
              <Text style={[styles.progressToggleText, { color: colors.text }]}>
                {Math.round(progressRatio * 100)}%
              </Text>
            )}
          </TouchableOpacity>

          {progressExpanded && (
            <View style={[styles.progressDrawer, { backgroundColor: colors.surface }]}>
              <Text style={[styles.progressDrawerTitle, { color: colors.text }]}>Trail progress</Text>
              <Text style={[styles.progressDrawerPercent, { color: colors.primary }]}>
                {Math.round(progressRatio * 100)}%
              </Text>

              <View style={[styles.progressTrackVertical, { backgroundColor: colors.surfaceMuted }]}>
                <View
                  style={[
                    styles.progressFillVertical,
                    { backgroundColor: colors.primary, height: `${Math.max(progressRatio * 100, 8)}%` },
                  ]}
                />
                <View style={styles.progressMarkersColumn}>
                  {trail.mushrooms.map((_: any, index: number) => (
                    <View
                      key={`vertical-marker-${index}`}
                      style={[
                        styles.progressMarker,
                        { backgroundColor: colors.surface },
                        index < activeStop && { backgroundColor: colors.primary },
                        index === activeStop && { backgroundColor: colors.accent },
                      ]}
                    />
                  ))}
                </View>
              </View>

              <View style={styles.progressDrawerStats}>
                <View style={styles.progressDrawerStat}>
                  <Text style={[styles.progressDrawerValue, { color: colors.text }]}>
                    {formatDistance(completedMeters)}
                  </Text>
                  <Text style={[styles.progressDrawerLabel, { color: colors.textMuted }]}>covered</Text>
                </View>
                <View style={styles.progressDrawerStat}>
                  <Text style={[styles.progressDrawerValue, { color: colors.text }]}>
                    {formatDistance(remainingMeters)}
                  </Text>
                  <Text style={[styles.progressDrawerLabel, { color: colors.textMuted }]}>left</Text>
                </View>
                <View style={styles.progressDrawerStat}>
                  <Text style={[styles.progressDrawerValue, { color: colors.text }]}>
                    {trail.mushrooms.length - activeStop}
                  </Text>
                  <Text style={[styles.progressDrawerLabel, { color: colors.textMuted }]}>stops</Text>
                </View>
              </View>
            </View>
          )}
        </View>
      )}

      {navStarted && (
        <View style={styles.stopRail}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {trail.mushrooms.map((item: any, index: number) => {
              const complete = index < activeStop;
              const active = index === activeStop;
              return (
                <TouchableOpacity
                  key={item._id || index}
                  style={styles.stopRailItem}
                  onPress={() => goToStop(index)}
                >
                  <View
                    style={[
                      styles.stopRailDot,
                      complete && { backgroundColor: colors.primary },
                      active && { backgroundColor: colors.accent, transform: [{ scale: 1.15 }] },
                    ]}
                  />
                  {index < trail.mushrooms.length - 1 && (
                    <View
                      style={[
                        styles.stopRailLine,
                        complete && { backgroundColor: colors.primary },
                      ]}
                    />
                  )}
                  <View
                    style={[
                      styles.stopRailCard,
                      {
                        backgroundColor:
                          theme === 'dark' ? 'rgba(12, 18, 13, 0.92)' : 'rgba(255,255,255,0.96)',
                      },
                      active && { borderColor: colors.accent, borderWidth: 1.5 },
                    ]}
                  >
                    <ExpoImage
                      source={{ uri: item.images?.[0]?.url || item.thumbnail }}
                      style={styles.stopRailImage}
                    />
                    <Text
                      style={[styles.stopRailLabel, { color: colors.text }]}
                      numberOfLines={1}
                    >
                      {item.commonName}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      <View style={styles.bottomSheet} pointerEvents="box-none">
        {navStarted ? (
          <View
            style={[
              styles.navCard,
              styles.navCardFloating,
              !navCardExpanded && styles.navCardCollapsed,
              { backgroundColor: colors.surface },
            ]}
          >
            <TouchableOpacity
              style={[styles.navCardHandle, { backgroundColor: colors.surfaceMuted }]}
              onPress={() => setNavCardExpanded((value) => !value)}
              activeOpacity={0.9}
            >
              <View style={[styles.navCardGrabber, { backgroundColor: colors.textMuted }]} />
              <View style={styles.navCardHandleContent}>
                <View style={styles.navCardHandleCopy}>
                  <Text style={[styles.navCardHandleTitle, { color: colors.text }]}>
                    {currentMushroom?.commonName}
                  </Text>
                  <Text style={[styles.navCardHandleSub, { color: colors.textMuted }]}>
                    {formatDistance(metersToNext)} away
                  </Text>
                </View>
                <View style={styles.navCardHandleActions}>
                  <TouchableOpacity
                    style={[styles.navChipButton, { backgroundColor: colors.surface }]}
                    onPress={() => setProgressExpanded((value) => !value)}
                  >
                    <Ionicons
                      name={progressExpanded ? 'stats-chart' : 'stats-chart-outline'}
                      size={15}
                      color={colors.text}
                    />
                    <Text style={[styles.navChipButtonText, { color: colors.text }]}>
                      {Math.round(progressRatio * 100)}%
                    </Text>
                  </TouchableOpacity>
                  <Ionicons
                    name={navCardExpanded ? 'chevron-down' : 'chevron-up'}
                    size={20}
                    color={colors.text}
                  />
                </View>
              </View>
            </TouchableOpacity>

            {navCardExpanded && (
              <>
                {offRoute && (
                  <View style={[styles.warningPill, { backgroundColor: '#FFF0C7' }]}>
                    <Ionicons name="alert-circle" size={16} color="#8A5A00" />
                    <Text style={styles.warningText}>You are drifting away from the planned trail.</Text>
                  </View>
                )}

                <View style={styles.topMetricsRow}>
                  <View style={styles.primaryMetric}>
                    <Text style={styles.kicker}>NEXT STOP</Text>
                    <Text style={[styles.primaryName, { color: colors.text }]}>
                      {currentMushroom?.commonName}
                    </Text>
                    <Text style={[styles.secondaryName, { color: colors.textMuted }]}>
                      {currentMushroom?.scientificName}
                    </Text>
                  </View>
                  <ExpoImage
                    source={{ uri: currentMushroom?.images?.[0]?.url || currentMushroom?.thumbnail }}
                    style={styles.heroThumb}
                  />
                </View>

                <View style={styles.liveStatsRow}>
                  <View style={styles.liveStat}>
                    <Text style={[styles.liveValue, { color: colors.primary }]}>
                      {formatDistance(metersToNext)}
                    </Text>
                    <Text style={[styles.liveLabel, { color: colors.textMuted }]}>to next</Text>
                  </View>
                  <View style={styles.liveStat}>
                    <Text style={[styles.liveValue, { color: colors.text }]}>
                      {formatMinutes(activeLegDurationSeconds)}
                    </Text>
                    <Text style={[styles.liveLabel, { color: colors.textMuted }]}>ETA</Text>
                  </View>
                  <View style={styles.liveStat}>
                    <Text style={[styles.liveValue, { color: colors.text }]}>
                      {formatDistance(remainingMeters)}
                    </Text>
                    <Text style={[styles.liveLabel, { color: colors.textMuted }]}>remaining</Text>
                  </View>
                </View>

                <View style={[styles.compactProgressRow, { backgroundColor: colors.surfaceMuted }]}>
                  <View>
                    <Text style={[styles.compactProgressLabel, { color: colors.textMuted }]}>Progress</Text>
                    <Text style={[styles.compactProgressValue, { color: colors.text }]}>
                      {Math.round(progressRatio * 100)}% complete
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.compactProgressButton, { backgroundColor: colors.surface }]}
                    onPress={() => setProgressExpanded((value) => !value)}
                  >
                    <Ionicons
                      name={progressExpanded ? 'eye-off-outline' : 'eye-outline'}
                      size={16}
                      color={colors.text}
                    />
                    <Text style={[styles.compactProgressButtonText, { color: colors.text }]}>
                      {progressExpanded ? 'Hide panel' : 'Open panel'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.arrivalRow}>
                  <View
                    style={[
                      styles.arrivalPill,
                      { backgroundColor: arrivedAtStop ? '#DFF6E3' : colors.surfaceMuted },
                    ]}
                  >
                    <Ionicons
                      name={arrivedAtStop ? 'checkmark-circle' : 'walk'}
                      size={16}
                      color={arrivedAtStop ? '#197A2F' : colors.textMuted}
                    />
                    <Text
                      style={[
                        styles.arrivalText,
                        { color: arrivedAtStop ? '#197A2F' : colors.textMuted },
                      ]}
                    >
                      {arrivedAtStop ? 'You are at the stop' : 'Move closer to unlock the stop'}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity style={styles.primaryButton} onPress={markCurrentStopDone}>
                  <LinearGradient colors={[colors.primary, colors.primaryDeep]} style={styles.buttonGradient}>
                    <Ionicons name="checkmark-done" size={18} color="#fff" />
                    <Text style={styles.buttonText}>
                      {activeStop === trail.mushrooms.length - 1 ? 'Finish trail' : 'Mark stop complete'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </>
            )}
          </View>
        ) : (
          <View style={[styles.navCard, { backgroundColor: colors.surface }]}>
            <View style={styles.previewStats}>
              <View style={styles.previewStat}>
                <Text style={[styles.previewValue, { color: colors.text }]}>
                  {trail.length || '3.2 km'}
                </Text>
                <Text style={[styles.previewLabel, { color: colors.textMuted }]}>Length</Text>
              </View>
              <View style={styles.previewStat}>
                <Text style={[styles.previewValue, { color: colors.text }]}>
                  {trail.difficulty || 'Easy'}
                </Text>
                <Text style={[styles.previewLabel, { color: colors.textMuted }]}>Level</Text>
              </View>
              <View style={styles.previewStat}>
                <Text style={[styles.previewValue, { color: colors.text }]}>
                  {trail.mushrooms.length}
                </Text>
                <Text style={[styles.previewLabel, { color: colors.textMuted }]}>Stops</Text>
              </View>
            </View>

            <View style={styles.previewInfoRow}>
              <Text style={[styles.previewInfoText, { color: colors.textMuted }]}>
                Planned route stays green, your real movement turns blue, and the live path to the next stop updates as you walk.
              </Text>
            </View>

            <TouchableOpacity style={styles.primaryButton} onPress={startNavigationFlow}>
              <LinearGradient colors={[colors.primary, colors.primaryDeep]} style={styles.buttonGradient}>
                <Ionicons name="navigate" size={20} color="#fff" />
                <Text style={styles.buttonText}>Start navigation</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  map: { flex: 1 },
  topHeader: { position: 'absolute', top: 0, left: 16, right: 16, zIndex: 100 },
  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 24,
    gap: 12,
    ...shadows.card,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleBlock: { flex: 1 },
  headerTitle: { fontSize: 16, fontWeight: '900' },
  headerSub: { fontSize: 11, fontWeight: '700', marginTop: 2 },
  mapControls: {
    position: 'absolute',
    right: 16,
    zIndex: 120,
  },
  mapControlsStack: {
    gap: 10,
  },
  mapControlsDefault: {
    top: 130,
  },
  mapControlsNavStarted: {
    top: 118,
  },
  leftProgressDock: {
    position: 'absolute',
    left: 12,
    top: 160,
    zIndex: 120,
    alignItems: 'flex-start',
  },
  progressToggle: {
    minWidth: 52,
    height: 52,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    ...shadows.soft,
  },
  progressToggleText: { fontSize: 12, fontWeight: '900' },
  progressDrawer: {
    width: 138,
    marginTop: 10,
    borderRadius: 24,
    paddingVertical: 16,
    paddingHorizontal: 14,
    ...shadows.card,
  },
  progressDrawerTitle: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.6 },
  progressDrawerPercent: { fontSize: 24, fontWeight: '900', marginTop: 6, marginBottom: 12 },
  progressTrackVertical: {
    width: 30,
    height: 170,
    borderRadius: 999,
    alignSelf: 'center',
    overflow: 'hidden',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  progressFillVertical: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 999,
  },
  progressMarkersColumn: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressDrawerStats: { marginTop: 14, gap: 10 },
  progressDrawerStat: { alignItems: 'flex-start' },
  progressDrawerValue: { fontSize: 14, fontWeight: '900' },
  progressDrawerLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', marginTop: 2 },
  mapControlButton: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.soft,
  },
  stopRail: {
    position: 'absolute',
    right: 16,
    top: 320,
    height: height * 0.24,
    width: 86,
    zIndex: 110,
  },
  stopRailItem: { alignItems: 'center', marginBottom: 18 },
  stopRailDot: { width: 11, height: 11, borderRadius: 5.5, backgroundColor: '#cad7cd', zIndex: 2 },
  stopRailLine: { position: 'absolute', top: 10, width: 2, height: 40, backgroundColor: '#dbe5dc' },
  stopRailCard: {
    marginTop: 6,
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderRadius: 14,
    alignItems: 'center',
    gap: 5,
    ...shadows.soft,
  },
  stopRailImage: { width: 38, height: 38, borderRadius: 10 },
  stopRailLabel: { width: 70, textAlign: 'center', fontSize: 9, fontWeight: '800' },
  bottomSheet: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 96,
    zIndex: 120,
  },
  navCard: {
    borderRadius: 30,
    padding: 22,
    ...shadows.floating,
  },
  navCardFloating: {
    paddingTop: 12,
    paddingBottom: 16,
  },
  navCardCollapsed: {
    paddingBottom: 12,
  },
  navCardHandle: {
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
  },
  navCardGrabber: {
    width: 42,
    height: 4,
    borderRadius: 999,
    alignSelf: 'center',
    marginBottom: 10,
    opacity: 0.65,
  },
  navCardHandleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  navCardHandleCopy: { flex: 1 },
  navCardHandleTitle: { fontSize: 15, fontWeight: '900' },
  navCardHandleSub: { fontSize: 12, fontWeight: '700', marginTop: 2 },
  navCardHandleActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  navChipButton: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  navChipButtonText: { fontSize: 11, fontWeight: '900' },
  warningPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    marginBottom: 14,
  },
  warningText: { color: '#8A5A00', fontSize: 12, fontWeight: '700' },
  topMetricsRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  primaryMetric: { flex: 1 },
  kicker: { fontSize: 10, fontWeight: '900', color: '#B07100', letterSpacing: 1 },
  primaryName: { fontSize: 22, fontWeight: '900', marginTop: 4 },
  secondaryName: { fontSize: 13, fontStyle: 'italic', marginTop: 2 },
  heroThumb: { width: 72, height: 72, borderRadius: 22 },
  liveStatsRow: { flexDirection: 'row', gap: 10, marginTop: 20 },
  liveStat: {
    flex: 1,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  liveValue: { fontSize: 16, fontWeight: '900' },
  liveLabel: { fontSize: 11, fontWeight: '700', marginTop: 4, textTransform: 'uppercase' },
  compactProgressRow: {
    marginTop: 16,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  compactProgressLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  compactProgressValue: { fontSize: 15, fontWeight: '900', marginTop: 2 },
  compactProgressButton: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  compactProgressButtonText: { fontSize: 11, fontWeight: '800' },
  progressMarker: { width: 10, height: 10, borderRadius: 5, borderWidth: 2, borderColor: '#fff' },
  arrivalRow: { marginTop: 18 },
  arrivalPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  arrivalText: { fontSize: 12, fontWeight: '700' },
  primaryButton: { marginTop: 18 },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 20,
    paddingVertical: 18,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '900' },
  previewStats: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  previewStat: { flex: 1, alignItems: 'center' },
  previewValue: { fontSize: 18, fontWeight: '900' },
  previewLabel: { fontSize: 11, fontWeight: '700', marginTop: 4, textTransform: 'uppercase' },
  previewInfoRow: { marginTop: 18 },
  previewInfoText: { fontSize: 13, lineHeight: 20, fontWeight: '600' },
  pinCard: {
    width: 84,
    height: 96,
    borderRadius: 22,
    backgroundColor: '#f3f6f1',
    borderWidth: 0,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'flex-start',
    ...shadows.soft,
  },
  pinImage: {
    width: '100%',
    height: 70,
    backgroundColor: '#dfe7dc',
  },
  pinDone: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 26,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.72,
  },
  pinFooter: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.12)',
  },
  pinFooterText: {
    fontSize: 9,
    fontWeight: '900',
    textAlign: 'center',
  },
  badgeIndex: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  badgeIndexText: { fontSize: 11, fontWeight: '900' },
});
