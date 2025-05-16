import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const HomeScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>首頁</Text>
      {/* 這裡可以加入功能入口按鈕等內容 */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111', // 特斯拉風格深色背景
  },
  title: {
    fontSize: 32,
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default HomeScreen;
