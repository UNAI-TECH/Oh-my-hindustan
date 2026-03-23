import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/Theme';

export default function AdminMonetizationScreen() {
  const navigation = useNavigation<any>();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8 }}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Platform Economics</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        <View style={styles.card}>
          <Text style={{ fontWeight: 'bold', fontSize: 16, alignSelf: 'flex-start' }}>Contribution Distribution</Text>
          
          <View style={styles.donutPlaceholder}>
             <View style={styles.donutInner}>
                <Text style={{ color: Colors.Slate500, fontSize: 12 }}>Total Fund</Text>
                <Text style={{ fontWeight: 'bold', fontSize: 24, color: Colors.PrimaryRed }}>₹12.8Cr</Text>
             </View>
          </View>

          <View style={{ width: '100%' }}>
            <DistributionRow label="Premium Membership" value="₹5.77Cr" color={Colors.PrimaryRed} />
            <DistributionRow label="Corporate Support" value="₹3.85Cr" color="#E2E8F0" />
            <DistributionRow label="Analyst Grants" value="₹3.21Cr" color="#475569" />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={{ fontWeight: 'bold', fontSize: 16, alignSelf: 'flex-start', marginBottom: 16 }}>Launch Community Initiative</Text>
          
          <Text style={styles.inputLabel}>Initiative Name</Text>
          <TextInput style={styles.input} />
          
          <Text style={styles.inputLabel}>Allocation (₹)</Text>
          <TextInput style={styles.input} keyboardType="numeric" />
          
          <TouchableOpacity style={styles.btn}>
            <Text style={{ color: 'white', fontWeight: 'bold' }}>Create Initiative</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const DistributionRow = ({ label, value, color }: any) => (
  <View style={styles.distributionRow}>
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color }} />
      <Text style={{ color: '#475569', fontSize: 14, marginLeft: 8 }}>{label}</Text>
    </View>
    <Text style={{ fontWeight: 'bold', fontSize: 16 }}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC', paddingTop: Platform.OS === 'android' ? 24 : 0 },
  header: { padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white' },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  card: { backgroundColor: 'white', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center', marginBottom: 24 },
  donutPlaceholder: { width: 160, height: 160, borderRadius: 80, borderWidth: 16, borderColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', marginVertical: 24 },
  donutInner: { alignItems: 'center' },
  distributionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4, width: '100%' },
  inputLabel: { alignSelf: 'flex-start', fontSize: 12, color: Colors.Slate500, marginBottom: 4, marginTop: 12 },
  input: { width: '100%', height: 56, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, paddingHorizontal: 16, backgroundColor: 'white' },
  btn: { width: '100%', height: 48, backgroundColor: Colors.PrimaryRed, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginTop: 16 }
});
