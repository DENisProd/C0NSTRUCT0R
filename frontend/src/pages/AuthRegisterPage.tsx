import { useState } from 'react';
import { Box, VStack, Heading, Input, Button, Alert, Text } from '@chakra-ui/react';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser } from '../lib/api/auth';

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
    <Box as="form" onSubmit={handleSubmit} padding="20px">
      <VStack gap="15px" align="stretch" maxWidth="420px" margin="0 auto">
        <Heading size="lg">Регистрация</Heading>
        {error && (
          <Alert.Root status="error">
            <Alert.Description>{error}</Alert.Description>
          </Alert.Root>
        )}
        <Input placeholder="Имя пользователя" value={username} onChange={(e) => setUsername(e.target.value)} />
        <Input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input placeholder="Пароль" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <Button type="submit" disabled={loading}>
          {loading ? 'Регистрация...' : 'Зарегистрироваться'}
        </Button>
        <Text>
          Уже есть аккаунт? <Link to="/auth/login">Войти</Link>
        </Text>
      </VStack>
    </Box>
  );
};