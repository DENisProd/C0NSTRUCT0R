import { useEffect, useRef } from 'react';
import { useWebSocketStore } from '../store/useWebSocketStore';
import { useProjectStore } from '../store/useProjectStore';
import type { Project, Block } from '../types';

/**
 * Хук для синхронизации изменений проекта через WebSocket
 * Автоматически отправляет изменения и применяет входящие обновления
 */
export function useWebSocketSync() {
  const { sendMessage, isConnected } = useWebSocketStore();
  const { project, setProject, currentProjectId, setCurrentProjectId } = useProjectStore();
  
  // Флаг для предотвращения циклических обновлений
  const isApplyingRemoteChange = useRef(false);
  const lastProjectHash = useRef<string>('');
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Вычисляем хеш проекта для отслеживания изменений
  const getProjectHash = (proj: Project) => {
    return JSON.stringify({
      blocks: proj.blocks,
      theme: proj.theme,
      header: proj.header,
      footer: proj.footer,
    });
  };

  // Отправка изменений через WebSocket
  const syncProject = () => {
    if (!isConnected || isApplyingRemoteChange.current) {
      return;
    }

    const currentHash = getProjectHash(project);
    if (currentHash === lastProjectHash.current) {
      return; // Нет изменений
    }

    lastProjectHash.current = currentHash;

    // Отправляем полное состояние проекта
    sendMessage({
      type: 'sync_state',
      payload: project,
    });
  };

  // Функция автосохранения проекта в БД
  const autoSaveProject = () => {
    if (!isConnected || isApplyingRemoteChange.current) {
      return;
    }

    // Отправляем сообщение для сохранения проекта
    sendMessage({
      type: 'save_project',
      payload: {
        projectId: currentProjectId,
        project: project,
      },
    });
  };

  // Настройка обработчиков WebSocket при подключении
  useEffect(() => {
    if (!isConnected) {
      return;
    }

    // Устанавливаем обработчик для входящих обновлений проекта
    useWebSocketStore.setState({
      onProjectUpdate: (updatedProject: Project) => {
        if (!isApplyingRemoteChange.current) {
          isApplyingRemoteChange.current = true;
          setProject(updatedProject);
          lastProjectHash.current = getProjectHash(updatedProject);
          // Сбрасываем флаг после небольшой задержки
          setTimeout(() => {
            isApplyingRemoteChange.current = false;
          }, 100);
        }
      },
      onProjectSaved: (projectId: number) => {
        // Обновляем ID проекта после сохранения
        if (!currentProjectId) {
          setCurrentProjectId(projectId);
        }
      },
    });

    // Отправляем текущее состояние при подключении
    syncProject();

    return () => {
      useWebSocketStore.setState({
        onProjectUpdate: undefined,
        onProjectSaved: undefined,
      });
    };
  }, [isConnected, currentProjectId, setCurrentProjectId]);

  // Отслеживание изменений проекта и отправка через WebSocket
  useEffect(() => {
    if (!isConnected || isApplyingRemoteChange.current) {
      return;
    }

    const currentHash = getProjectHash(project);
    if (currentHash === lastProjectHash.current) {
      return; // Нет изменений
    }

    // Очищаем предыдущий таймер автосохранения
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Дебаунс для избежания слишком частых отправок синхронизации
    const syncTimeoutId = setTimeout(() => {
      syncProject();
    }, 500); // Увеличиваем задержку для уменьшения нагрузки

    // Автосохранение в БД с большей задержкой (2 секунды)
    saveTimeoutRef.current = setTimeout(() => {
      autoSaveProject();
    }, 2000);

    return () => {
      clearTimeout(syncTimeoutId);
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [project, isConnected, currentProjectId]);

  // Функции-обертки для отправки конкретных событий
  const sendBlockUpdate = (blockId: string, updates: Partial<Block>) => {
    if (!isConnected) return;
    sendMessage({
      type: 'update_block',
      payload: {
        blockId,
        data: updates,
      },
    });
  };

  const sendBlockAdd = (block: Block) => {
    if (!isConnected) return;
    sendMessage({
      type: 'add_block',
      payload: {
        block,
      },
    });
  };

  const sendBlockDelete = (blockId: string) => {
    if (!isConnected) return;
    sendMessage({
      type: 'delete_block',
      payload: {
        blockId,
      },
    });
  };

  const sendBlockMove = (fromIndex: number, toIndex: number) => {
    if (!isConnected) return;
    sendMessage({
      type: 'move_block',
      payload: {
        fromIndex,
        toIndex,
      },
    });
  };

  const sendThemeUpdate = (updates: Partial<Project['theme']>) => {
    if (!isConnected) return;
    sendMessage({
      type: 'update_theme',
      payload: updates,
    });
  };

  const sendHeaderUpdate = (updates: Partial<Project['header']>) => {
    if (!isConnected) return;
    sendMessage({
      type: 'update_header',
      payload: updates,
    });
  };

  const sendFooterUpdate = (updates: Partial<Project['footer']>) => {
    if (!isConnected) return;
    sendMessage({
      type: 'update_footer',
      payload: updates,
    });
  };

  return {
    sendBlockUpdate,
    sendBlockAdd,
    sendBlockDelete,
    sendBlockMove,
    sendThemeUpdate,
    sendHeaderUpdate,
    sendFooterUpdate,
  };
}

