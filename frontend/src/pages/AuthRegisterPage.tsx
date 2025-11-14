import { useState } from 'react';
import { Box, VStack, Heading, Input, Button, Alert, Text, HStack } from '@chakra-ui/react';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser } from '../lib/api/auth';
import { UserPlus, User, Mail, Lock } from 'lucide-react';

export const AuthRegisterPage = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setLoading(true);
    setError(null);
    try {
      await registerUser({ username, email, password });
      navigate('/auth/login');
    } catch (e: any) {
      setError(e?.message || 'Ошибка регистрации');
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
            <UserPlus size={24} color="var(--app-accent)" />
            <Heading size="lg" color="var(--app-accent)">Регистрация</Heading>
          </HStack>
          {error && (
            <Alert.Root status="error">
              <Alert.Description>{error}</Alert.Description>
            </Alert.Root>
          )}
          <HStack gap="8px" align="center">
            <User size={18} color="var(--app-text-muted)" />
            <Input placeholder="Имя пользователя" value={username} onChange={(e) => setUsername(e.target.value)} backgroundColor="white" border="1px solid var(--app-border)" />
          </HStack>
          <HStack gap="8px" align="center">
            <Mail size={18} color="var(--app-text-muted)" />
            <Input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} backgroundColor="white" border="1px solid var(--app-border)" />
          </HStack>
          <HStack gap="8px" align="center">
            <Lock size={18} color="var(--app-text-muted)" />
            <Input placeholder="Пароль" type="password" value={password} onChange={(e) => setPassword(e.target.value)} backgroundColor="white" border="1px solid var(--app-border)" />
          </HStack>
          <Button type="submit" disabled={loading} backgroundColor="var(--app-accent)" color="white" _hover={{ opacity: 0.9 }}>
            {loading ? 'Регистрация...' : 'Зарегистрироваться'}
          </Button>
          <Text color="var(--app-text-muted)">
            Уже есть аккаунт? <Link to="/auth/login">Войти</Link>
          </Text>
        </VStack>
      </Box>
    </Box>
  );
};