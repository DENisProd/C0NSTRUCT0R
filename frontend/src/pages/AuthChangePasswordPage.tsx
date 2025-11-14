import { useState } from 'react';
import { Box, VStack, Heading, Input, Button, Alert } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { changePassword } from '../lib/api/auth';
import { useAuthStore } from '../store/useAuthStore';

export const AuthChangePasswordPage = () => {
  const navigate = useNavigate();
  const { token } = useAuthStore();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const submit = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      if (!token) {
        throw new Error('Требуется вход');
      }
      await changePassword({ old_password: oldPassword, new_password: newPassword }, token);
      setSuccess('Пароль изменён');
      setOldPassword('');
      setNewPassword('');
      navigate('/editor');
    } catch (e: any) {
      setError(e?.message || 'Ошибка смены пароля');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box padding="20px">
      <VStack gap="15px" align="stretch" maxWidth="420px" margin="0 auto">
        <Heading size="lg">Смена пароля</Heading>
        {error && (
          <Alert.Root status="error">
            <Alert.Description>{error}</Alert.Description>
          </Alert.Root>
        )}
        {success && (
          <Alert.Root status="success">
            <Alert.Description>{success}</Alert.Description>
          </Alert.Root>
        )}
        <Input placeholder="Текущий пароль" type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} />
        <Input placeholder="Новый пароль" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        <Button onClick={submit} disabled={loading}>
          {loading ? 'Сохранение...' : 'Изменить пароль'}
        </Button>
      </VStack>
    </Box>
  );
};