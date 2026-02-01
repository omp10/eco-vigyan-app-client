import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { trailService } from '../../services/api';
import { ActivityIndicator } from 'react-native';
import { useAuth } from '../../context/AuthContext';

import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';

export default function TrailScreen() {
  const router = useRouter();
  const { user } = useAuth(); // Get user to check permissions if needed
  const [trails, setTrails] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal States
  /* Removed createModalVisible */
  /* Removed Load Modal State */
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedTrail, setSelectedTrail] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadTrails();
    }, [])
  );

  const loadTrails = async () => {
   /* ... existing loadTrails ... */ 
    try {
      setLoading(true);
      const data = await trailService.getAllTrails();
      setTrails(data);
    } catch (error) {
      console.error('Error loading trails:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePress = () => {
    router.push('/create-trail');
  };

  const handleTrailPress = (trail: any) => {
    // Navigate directly to active trail PREVIEW (skipLocation=true effectively means "don't track yet")
    // Actually, let's just pass nothing for skipLocation, default behavior in active-trail will handle it.
    // Or pass 'true' to ensure it starts in preview mode without permission prompt.
    router.push({
      pathname: '/active-trail',
      params: { 
        trailId: trail._id,
        skipLocation: 'true' 
      }
    });
  };

  const handleDeletePress = (trail: any) => {
    setSelectedTrail(trail);
    setDeleteModalVisible(true);
  };

  /* ... confirmDeleteTrail ... */
  const confirmDeleteTrail = async () => {
    if (!selectedTrail) return;
    
    try {
      setIsDeleting(true);
       const token = await import('@react-native-async-storage/async-storage').then(m => m.default.getItem('@ecovigyan_auth_token'));
       
       if (token) {
         await trailService.deleteTrail(selectedTrail._id, token);
         await loadTrails(); 
         setDeleteModalVisible(false);
         setSelectedTrail(null);
       } else {
         Alert.alert("Error", "Authentication required to delete trails.");
       }

    } catch (error) {
      console.error('Error deleting trail:', error);
      Alert.alert('Error', 'Failed to delete trail');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      <View className="px-6 py-4 flex-row justify-between items-center border-b border-slate-100">
        <Text className="text-2xl font-bold text-slate-800">My Trails</Text>
        {user?.role === 'admin' && (
        <TouchableOpacity 
          className="bg-[#11d421] px-4 py-2 rounded-full flex-row items-center gap-1"
          onPress={handleCreatePress}
        >
          <MaterialIcons name="add" size={18} color="white" />
          <Text className="text-white font-bold text-sm">New</Text>
        </TouchableOpacity>
        )}
      </View>

      <ScrollView className="flex-1 px-6 pt-4" showsVerticalScrollIndicator={false}>
        {loading ? (
          <View className="flex-1 justify-center items-center py-20">
            <ActivityIndicator size="large" color="#4C7C32" />
          </View>
        ) : trails.length === 0 ? (
           <View className="flex-1 justify-center items-center py-20 gap-4">
              <MaterialIcons name="landscape" size={64} color="#cbd5e1" />
              <Text className="text-slate-400 text-center">No trails found. Create your first trail!</Text>
           </View>
        ) : (
          <View className="gap-4 pb-24">
          {trails.map((trail) => (
             <TouchableOpacity 
                key={trail._id}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
                onPress={() => handleTrailPress(trail)}
             >
                <Image 
                    source={{ uri: trail.mushrooms?.[0]?.images?.[0]?.url || trail.mushrooms?.[0]?.thumbnail || trail.image || "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=2560&auto=format&fit=crop" }} 
                    className="w-full h-40"
                    resizeMode="cover"
                />
                <View className="absolute top-3 right-3 bg-white/90 px-3 py-1 rounded-full z-10">
                    <Text className="text-slate-800 text-xs font-bold">{trail.difficulty || "Moderate"}</Text>
                </View>

                {user?.role === 'admin' && (
                  <TouchableOpacity 
                    className="absolute top-3 left-3 bg-red-100 p-2 rounded-full z-10 shadow-sm"
                    onPress={() => handleDeletePress(trail)}
                  >
                    <MaterialIcons name="delete-outline" size={20} color="#ef4444" />
                  </TouchableOpacity>
                )}

                <View className="p-4">
                    <Text className="text-lg font-bold text-slate-800 mb-1">{trail.name}</Text>
                    <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-slate-100">
                      <View className="flex-row items-center gap-4">
                          <View className="flex-row items-center gap-1">
                              <MaterialIcons name="straighten" size={16} color="#64748b" />
                              <Text className="text-slate-500 text-sm">{trail.length || "Unknown"}</Text>
                          </View>
                          <View className="flex-row items-center gap-1">
                              <MaterialIcons name="science" size={16} color="#64748b" />
                              <Text className="text-slate-500 text-sm">{Array.isArray(trail.mushrooms) ? trail.mushrooms.length : 0} species</Text>
                          </View>
                      </View>
                      <View className="flex-row items-center gap-1 bg-blue-50 px-3 py-1.5 rounded-full">
                        <Text className="text-blue-600 font-bold text-xs">Open Trail</Text>
                        <MaterialIcons name="arrow-forward" size={14} color="#2563eb" />
                      </View>
                    </View>
                </View>
             </TouchableOpacity>
          ))}
          </View>
        )}
      </ScrollView>

      {/* Create Trail Options Modal - REMOVED */}

      {/* Load Trail Options Modal - REMOVED */ }

      {/* Delete Confirmation Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={deleteModalVisible}
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/60 px-6">
          <View className="bg-white rounded-2xl p-6 w-full gap-4 items-center">
            <View className="w-16 h-16 bg-red-100 rounded-full items-center justify-center mb-2">
              <MaterialIcons name="warning-amber" size={32} color="#ef4444" />
            </View>
            <Text className="text-xl font-bold text-slate-800 text-center">Delete Trail?</Text>
            <Text className="text-slate-500 text-center mb-4">
              Are you sure you want to delete "{selectedTrail?.name}"? This action cannot be undone.
            </Text>
            
            <View className="flex-row gap-3 w-full">
              <TouchableOpacity 
                className="flex-1 bg-slate-100 p-4 rounded-xl items-center"
                onPress={() => {
                   setDeleteModalVisible(false);
                   // Maybe reopen load modal? Or just close all.
                   setSelectedTrail(null);
                }}
              >
                <Text className="text-slate-700 font-bold text-lg">Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                className="flex-1 bg-red-500 p-4 rounded-xl items-center flex-row justify-center gap-2"
                onPress={confirmDeleteTrail}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Text className="text-white font-bold text-lg">Delete</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}
