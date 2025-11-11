import { useFunctionsStore } from '../store/useFunctionsStore';
import { executeAction } from './actions';
import type { ProjectFunction, TriggerType } from '../types';

export function executeBlockFunctions(
  blockId: string,
  trigger: TriggerType,
  functions: ProjectFunction[]
): void {
  const block = document.querySelector(`[data-block-id="${blockId}"]`);
  if (!block) return;

  const relevantFunctions = functions.filter((fn) => {
    if (!fn.enabled) return false;
    
    if (fn.trigger !== trigger) return false;
    
    if (fn.blockId && fn.blockId !== blockId) return false;
    if (!fn.blockId) {
      return false;
    }
    
    return true;
  });

  relevantFunctions.forEach((fn) => {
    try {
      let shouldExecute = true;
      
      if (fn.conditions && fn.conditions.length > 0) {
        shouldExecute = fn.conditions.every((condition) => {
          if (condition.expression) {
            try {
              return eval(condition.expression);
            } catch {
              return false;
            }
          }
          return true;
        });
      }
      
      if (shouldExecute) {
        fn.actions.forEach((action) => {
          if (action.type === 'custom' && action.code) {
            try {
              const func = new Function('block', 'event', action.code);
              func(block, trigger);
            } catch (error) {
              console.error('Ошибка выполнения кастомного действия:', error);
            }
          } else {
            executeAction(action.type, {
              ...action.args,
              selector: `[data-block-id="${blockId}"]`,
            });
          }
        });
      }
    } catch (error) {
      console.error(`Ошибка выполнения функции ${fn.name}:`, error);
    }
  });
}

export function getBlockEventFunctions(
  trigger: TriggerType,
  functions: ProjectFunction[],
  blockEvents?: { [key in TriggerType]?: string[] }
): ProjectFunction[] {
  if (!blockEvents || !blockEvents[trigger]) {
    return [];
  }
  
  const functionIds = blockEvents[trigger] || [];
  return functions.filter((fn) => functionIds.includes(fn.id) && fn.enabled);
}

/**
 * Выполняет функции из events блока
 */
export function executeBlockEventFunctions(
  blockId: string,
  trigger: TriggerType,
  blockEvents?: { [key in TriggerType]?: string[] }
): void {
  const { functions } = useFunctionsStore.getState();
  const relevantFunctions = getBlockEventFunctions(trigger, functions, blockEvents);
  
  relevantFunctions.forEach((fn) => {
    try {
      // Проверяем условия
      let shouldExecute = true;
      
      if (fn.conditions && fn.conditions.length > 0) {
        shouldExecute = fn.conditions.every((condition) => {
          if (condition.expression) {
            try {
              return eval(condition.expression);
            } catch {
              return false;
            }
          }
          return true;
        });
      }
      
      if (shouldExecute) {
        // Выполняем действия
        fn.actions.forEach((action) => {
          if (action.type === 'custom' && action.code) {
            const block = document.querySelector(`[data-block-id="${blockId}"]`);
            if (block) {
              try {
                const func = new Function('block', 'event', action.code);
                func(block, trigger);
              } catch (error) {
                console.error('Ошибка выполнения кастомного действия:', error);
              }
            }
          } else {
            executeAction(action.type, {
              ...action.args,
              selector: `[data-block-id="${blockId}"]`,
            });
          }
        });
      }
    } catch (error) {
      console.error(`Ошибка выполнения функции ${fn.name}:`, error);
    }
  });
}


