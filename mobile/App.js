import React, { useMemo, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, useColorScheme } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Constants from 'expo-constants';
import { Ionicons } from '@expo/vector-icons';

// Update mobile/app.json when the backend host changes; Android emulators often need 10.0.2.2 instead of 127.0.0.1.
const API_BASE_URL = Constants.expoConfig?.extra?.apiBaseUrl || 'http://127.0.0.1:8001/api/v1';

const tabs = [
  ['dashboard', 'Home', 'grid-outline'],
  ['community', 'Community', 'people-outline'],
  ['alerts', 'Alerts', 'notifications-outline'],
  ['settings', 'Settings', 'settings-outline'],
];

export default function App() {
  const systemScheme = useColorScheme();
  const [darkMode, setDarkMode] = useState(systemScheme === 'dark');
  const [tab, setTab] = useState('dashboard');
  const [loggedIn, setLoggedIn] = useState(false);
  const [phone, setPhone] = useState('+254799000222');
  const [password, setPassword] = useState('password123');
  const [token, setToken] = useState('');
  const [status, setStatus] = useState('');
  const theme = useMemo(() => getTheme(darkMode), [darkMode]);

  const login = async () => {
    setStatus('Signing in...');
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_number: phone, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Login failed');
      setToken(data.access);
      setLoggedIn(true);
      setStatus('Connected to Arvion backend');
    } catch (error) {
      setStatus(error.message);
    }
  };

  if (!loggedIn) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
        <StatusBar style={darkMode ? 'light' : 'dark'} />
        <View style={styles.login}>
          <View style={[styles.logo, { backgroundColor: theme.green }]}>
            <Ionicons name="leaf-outline" size={28} color="white" />
          </View>
          <Text style={[styles.title, { color: theme.text }]}>Arvion</Text>
          <Text style={[styles.muted, { color: theme.muted }]}>Dairy operations in your pocket.</Text>
          <TextInput value={phone} onChangeText={setPhone} placeholder="+254..." placeholderTextColor={theme.muted} style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.card }]} />
          <TextInput value={password} onChangeText={setPassword} secureTextEntry placeholder="Password" placeholderTextColor={theme.muted} style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.card }]} />
          <TouchableOpacity onPress={login} style={[styles.primaryButton, { backgroundColor: theme.green }]}>
            <Text style={styles.primaryText}>Login</Text>
          </TouchableOpacity>
          {!!status && <Text style={[styles.muted, { color: theme.muted }]}>{status}</Text>}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <StatusBar style={darkMode ? 'light' : 'dark'} />
      <View style={[styles.header, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View>
          <Text style={[styles.headerEyebrow, { color: theme.green }]}>Arvion</Text>
          <Text style={[styles.headerTitle, { color: theme.text }]}>{tabs.find((item) => item[0] === tab)?.[1]}</Text>
        </View>
        <TouchableOpacity onPress={() => setDarkMode(!darkMode)} style={[styles.iconButton, { borderColor: theme.border }]}>
          <Ionicons name={darkMode ? 'sunny-outline' : 'moon-outline'} size={20} color={theme.text} />
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        {tab === 'dashboard' && <Dashboard theme={theme} />}
        {tab === 'community' && <Community theme={theme} token={token} setStatus={setStatus} />}
        {tab === 'alerts' && <Alerts theme={theme} />}
        {tab === 'settings' && <Settings theme={theme} />}
        {!!status && <Text style={[styles.status, { color: theme.muted }]}>{status}</Text>}
      </ScrollView>
      <View style={[styles.tabBar, { backgroundColor: theme.card, borderColor: theme.border }]}>
        {tabs.map(([key, label, icon]) => (
          <TouchableOpacity key={key} onPress={() => setTab(key)} style={styles.tab}>
            <Ionicons name={icon} size={22} color={tab === key ? theme.green : theme.muted} />
            <Text style={{ color: tab === key ? theme.green : theme.muted, fontSize: 11, fontWeight: '700' }}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

function Dashboard({ theme }) {
  return (
    <View style={styles.stack}>
      <Card theme={theme} title="Dairy Alerts" icon="alert-circle-outline">
        <Text style={[styles.body, { color: theme.text }]}>Heat cycle watch, calf vaccine, milk price, and low-yield checks.</Text>
      </Card>
      <View style={styles.row}>
        <Metric theme={theme} label="Today milk" value="0.0 L" />
        <Metric theme={theme} label="Plan" value="Basic" />
      </View>
      <Card theme={theme} title="Quick Actions" icon="add-circle-outline">
        <Text style={[styles.body, { color: theme.muted }]}>Record milk, share surplus, flag low milk, or open communities.</Text>
      </Card>
    </View>
  );
}

function Community({ theme, token, setStatus }) {
  const [title, setTitle] = useState('Surplus evening milk');
  const [body, setBody] = useState('I have extra clean milk after evening milking.');

  const share = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/community/posts/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ post_type: 'SURPLUS', title, body, county: 'Kiambu', litres_available: 10 }),
      });
      if (!response.ok) throw new Error('Could not share update');
      setStatus('Surplus milk update shared');
    } catch (error) {
      setStatus(error.message);
    }
  };

  return (
    <View style={styles.stack}>
      <Card theme={theme} title="Kiambu Dairy Circle" icon="people-outline">
        <Text style={[styles.body, { color: theme.muted }]}>WhatsApp-style communities for prices, alerts, surplus milk, and low milk flags.</Text>
      </Card>
      <TextInput value={title} onChangeText={setTitle} style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.card }]} />
      <TextInput value={body} onChangeText={setBody} style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.card }]} />
      <TouchableOpacity onPress={share} style={[styles.primaryButton, { backgroundColor: theme.green }]}>
        <Text style={styles.primaryText}>Share surplus milk</Text>
      </TouchableOpacity>
    </View>
  );
}

function Alerts({ theme }) {
  return (
    <View style={styles.stack}>
      {['Heat Cycle Watch', 'Calf Vaccine', 'Milk Price'].map((title) => (
        <Card key={title} theme={theme} title={title} icon="notifications-outline">
          <Text style={[styles.body, { color: theme.muted }]}>Tap in the web app to schedule full reminder details.</Text>
        </Card>
      ))}
    </View>
  );
}

function Settings({ theme }) {
  return (
    <View style={styles.stack}>
      <Card theme={theme} title="Dark Mode" icon="moon-outline">
        <Text style={[styles.body, { color: theme.muted }]}>The mobile app follows the same Arvion light/dark design direction.</Text>
      </Card>
      <Card theme={theme} title="Membership" icon="card-outline">
        <Text style={[styles.body, { color: theme.muted }]}>Trial, Basic, Premium, and Enterprise use the same backend API as web.</Text>
      </Card>
    </View>
  );
}

function Card({ theme, title, icon, children }) {
  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <Ionicons name={icon} size={24} color={theme.green} />
      <Text style={[styles.cardTitle, { color: theme.text }]}>{title}</Text>
      {children}
    </View>
  );
}

function Metric({ theme, label, value }) {
  return (
    <View style={[styles.metric, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <Text style={[styles.muted, { color: theme.muted }]}>{label}</Text>
      <Text style={[styles.metricValue, { color: theme.text }]}>{value}</Text>
    </View>
  );
}

function getTheme(dark) {
  return {
    background: dark ? '#020617' : '#f4f7f3',
    card: dark ? '#0f172a' : '#ffffff',
    text: dark ? '#f8fafc' : '#0f172a',
    muted: dark ? '#94a3b8' : '#64748b',
    border: dark ? '#1e293b' : '#e2e8f0',
    green: '#047857',
  };
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  login: { flex: 1, justifyContent: 'center', padding: 24, gap: 14 },
  logo: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 34, fontWeight: '900' },
  muted: { fontSize: 13 },
  input: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12 },
  primaryButton: { borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  primaryText: { color: 'white', fontWeight: '900' },
  header: { height: 72, borderBottomWidth: 1, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerEyebrow: { fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
  headerTitle: { fontSize: 22, fontWeight: '900' },
  iconButton: { borderWidth: 1, borderRadius: 14, padding: 10 },
  content: { padding: 16, paddingBottom: 100 },
  stack: { gap: 14 },
  card: { borderWidth: 1, borderRadius: 20, padding: 18, gap: 8 },
  cardTitle: { fontSize: 18, fontWeight: '900' },
  body: { fontSize: 14, lineHeight: 20 },
  row: { flexDirection: 'row', gap: 12 },
  metric: { flex: 1, borderWidth: 1, borderRadius: 18, padding: 16 },
  metricValue: { marginTop: 8, fontSize: 22, fontWeight: '900' },
  tabBar: { height: 72, borderTopWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  tab: { alignItems: 'center', gap: 4 },
  status: { marginTop: 16, textAlign: 'center' },
});
