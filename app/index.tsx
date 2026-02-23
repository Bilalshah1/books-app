import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';



export default function HomeScreen() {
  const [query, setQuery] = useState('');
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();

  const handleSearch = () => {
    if (query.trim()) {
      // Navigate to search results, e.g.: router.push(`/search?q=${query}`);
      console.log('Searching for:', query);
    }
  };

  return (
    <View style={styles.container}>
      {/* Dark mode toggle */}
      <TouchableOpacity style={styles.darkModeButton}>
        <Ionicons
          name={isDark ? 'sunny' : 'moon'}
          size={22}
          color={isDark ? '#fff' : '#5C6BC0'}
        />
      </TouchableOpacity>

      {/* Center content */}
      <View style={styles.centerContent}>
        {/* Book icon */}
        <View style={styles.iconContainer}>
          <Ionicons name="book" size={80} color="#5C6BC0" />
        </View>


        <TouchableOpacity
          style={[styles.searchBar, isDark && styles.searchBarDark]}
          activeOpacity={0.8}
          onPress={() => router.push('/search')}
        >
          <Ionicons name="search" size={18} color="#9E9E9E" style={styles.searchIcon} />
          <Text style={{ fontSize: 15, color: '#9E9E9E' }}>Search Books...</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 0,
    paddingHorizontal: 24,
  },
  darkModeButton: {
    alignSelf: 'flex-end',
    padding: 8,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -80, // offset to visually center accounting for top bar
  },
  iconContainer: {
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#5C6BC0',
    marginBottom: 36,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    width: '100%',
    boxShadow: '0px 1px 4px rgba(0,0,0,0.06)',
    elevation: 2,
  },
  searchBarDark: {
    backgroundColor: '#2C2C2E',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#212121',
  },
  searchInputDark: {
    color: '#F5F5F5',
  },
});