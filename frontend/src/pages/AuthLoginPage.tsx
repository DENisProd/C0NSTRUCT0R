import { useState } from 'react';
import { Box, VStack, Heading, Input, Button, Alert, Text } from '@chakra-ui/react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../lib/api/auth';
import { useAuthStore } from '../store/useAuthStore';

export const AuthLoginPage = () => {
  const navigate = useNavigate();
  const { setToken } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setLoading(true);
    setError(null);
    try {
      const t = await login({ email, password });
      setToken(t, email);
      navigate('/editor');
    } catch (e: any) {
      setError(e?.message || 'Ошибка входа');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!loading) submit();
  };

  return (
    <Box as="form" onSubmit={handleSubmit} padding="20px">
      <VStack gap="15px" align="stretch" maxWidth="420px" margin="0 auto">
        <Heading size="lg">Вход</Heading>
        {error && (
          <Alert.Root status="error">
            <Alert.Description>{error}</Alert.Description>
          </Alert.Root>
        )}
        <Input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input placeholder="Пароль" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <Button type="submit" disabled={loading}>
          {loading ? 'Вход...' : 'Войти'}
        </Button>
        <Text>
          Нет аккаунта? <Link to="/auth/register">Регистрация</Link>
        </Text>
        <Text>
          Сменить пароль? <Link to="/auth/change-password">Перейти</Link>
        </Text>
      </VStack>
    </Box>
  );
};