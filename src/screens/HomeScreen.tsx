import React from 'react';
import styled from 'styled-components/native';

const Container = styled.View`
  flex: 1;
  background-color: #181A1B;
  align-items: center;
  justify-content: center;
`;

const Title = styled.Text`
  color: #fff;
  font-size: 32px;
  font-weight: bold;
  margin-bottom: 16px;
`;

const Description = styled.Text`
  color: #bbb;
  font-size: 18px;
`;

export default function HomeScreen() {
  return (
    <Container>
      <Title>車機 UI Demo</Title>
      <Description>這是首頁，請從下方切換各功能頁</Description>
    </Container>
  );
}
