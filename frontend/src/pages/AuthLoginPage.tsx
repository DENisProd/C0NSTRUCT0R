import { useState } from 'react';
import { Box, VStack, Heading, Input, Button, Alert, Text, HStack } from '@chakra-ui/react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../lib/api/auth';
import { useAuthStore } from '../store/useAuthStore';
import { LogIn, Mail, Lock } from 'lucide-react';

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
      navigate('/profile');
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
    <Box minHeight="100vh" display="flex" alignItems="center" justifyContent="center" backgroundColor="var(--app-bg-muted)">
      <Box as="form" onSubmit={handleSubmit} padding="24px" width="100%" maxWidth="420px" backgroundColor="var(--app-surface)" border="1px solid var(--app-border)" borderRadius="12px">
        <VStack gap="16px" align="stretch">
          <HStack gap="8px" align="center">
            <LogIn size={24} color="var(--app-accent)" />
            <Heading size="lg" color="var(--app-accent)">Вход</Heading>
          </HStack>
          {error && (
            <Alert.Root status="error">
              <Alert.Description>{error}</Alert.Description>
            </Alert.Root>
          )}
          <HStack gap="8px" align="center">
            <Mail size={18} color="var(--app-text-muted)" />
            <Input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} backgroundColor="white" border="1px solid var(--app-border)" />
          </HStack>
          <HStack gap="8px" align="center">
            <Lock size={18} color="var(--app-text-muted)" />
            <Input placeholder="Пароль" type="password" value={password} onChange={(e) => setPassword(e.target.value)} backgroundColor="white" border="1px solid var(--app-border)" />
          </HStack>
          <Button type="submit" disabled={loading} backgroundColor="var(--app-accent)" color="white" _hover={{ opacity: 0.9 }}>
            {loading ? 'Вход...' : 'Войти'}
          </Button>
          <Text color="var(--app-text-muted)">
            Нет аккаунта? <Link to="/auth/register">Регистрация</Link>
          </Text>
        </VStack>
      </Box>
    </Box>
  );
};