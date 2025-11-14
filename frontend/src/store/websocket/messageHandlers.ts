import type { Project } from '../../types';
import type { WebSocketMessage, RoomUser, CursorPosition } from './useWebSocketStore';
import { useWebSocketStore } from './useWebSocketStore';

export interface WebSocketStore {
  userId: string | null;
  onProjectUpdate?: (project: Project) => void;
  onUserJoin?: (user: RoomUser) => void;
  onUserLeave?: (userId: string) => void;
  onCursorUpdate?: (cursor: CursorPosition) => void;
  onProjectSaved?: (projectId: number) => void;
}

export function handleIncomingMessage(
  message: WebSocketMessage,
  state: WebSocketStore
) {
  switch (message.type) {
    case 'join': {
      const user = message.payload as RoomUser;
      if (user.id !== state.userId) {
        // Добавляем пользователя, сохраняя уникальность по имени
        useWebSocketStore.setState((s) => ({
          users: [...s.users.filter((u) => u.name !== user.name), user],
        }));
        if (state.onUserJoin) {
          state.onUserJoin(user);
        }
      }
      break;
    }

    case 'leave': {
      const userId = message.payload?.userId || message.userId;
      if (userId) {
        useWebSocketStore.setState((s) => ({
          users: s.users.filter((u) => u.id !== userId),
          cursors: new Map([...s.cursors].filter(([id]) => id !== userId)),
        }));
        if (state.onUserLeave) {
          state.onUserLeave(userId);
        }
      }
      break;
    }

    case 'sync_state': {
      const project = message.payload as Project;
      if (project && state.onProjectUpdate) {
        // Обновляем только если это не наше собственное сообщение
        if (message.userId !== state.userId) {
          state.onProjectUpdate(project);
        }
      }
      break;
    }

    case 'users_list': {
      const users = message.payload as RoomUser[];
      if (Array.isArray(users)) {
        // Дедупликация списка по имени, сохраняем последнюю запись
        const byName = new Map<string, RoomUser>();
        for (const u of users) {
          byName.set(u.name, u);
        }
        useWebSocketStore.setState({ users: Array.from(byName.values()) });
      }
      break;
    }

    case 'update_block':
    case 'add_block':
    case 'delete_block':
    case 'move_block':
    case 'update_theme':
    case 'update_header':
    case 'update_footer': {
      // Эти события должны привести к обновлению проекта
      // Для простоты запрашиваем полное состояние или обрабатываем через sync_state
      // В реальности сервер должен отправлять обновленное состояние
      break;
    }

    case 'cursor_update': {
      const cursor = message.payload as CursorPosition;
      if (cursor && cursor.userId !== state.userId) {
        useWebSocketStore.setState((s) => {
          const newCursors = new Map(s.cursors);
          newCursors.set(cursor.userId, cursor);
          return { cursors: newCursors };
        });
        if (state.onCursorUpdate) {
          state.onCursorUpdate(cursor);
        }
      }
      break;
    }

    case 'project_saved': {
      // Обработка ответа об успешном сохранении проекта
      const { projectId } = message.payload || {};
      if (projectId) {
        const currentState = useWebSocketStore.getState();
        if (currentState.onProjectSaved) {
          currentState.onProjectSaved(projectId);
        }
      }
      break;
    }

    default:
      console.warn('Неизвестный тип сообщения:', message.type);
  }
}

