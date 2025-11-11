import type { ActionType } from '../types';

export interface ActionDefinition {
  type: ActionType;
  name: string;
  description: string;
  args: Array<{
    name: string;
    type: 'string' | 'number' | 'boolean' | 'object' | 'array';
    description: string;
    required?: boolean;
    default?: any;
  }>;
  execute: (args: Record<string, any>) => void | Promise<void>;
}

export const changeThemeAction: ActionDefinition = {
  type: 'changeTheme',
  name: 'Смена темы',
  description: 'Переключает тему между светлой и тёмной',
  args: [
    {
      name: 'mode',
      type: 'string',
      description: 'Режим темы: "light" или "dark"',
      required: true,
    },
  ],
  execute: (args) => {
    const mode = args.mode || 'light';
    document.documentElement.setAttribute('data-theme', mode);
    console.log('Смена темы на:', mode);
  },
};

export const redirectAction: ActionDefinition = {
  type: 'redirect',
  name: 'Редирект',
  description: 'Перенаправляет пользователя на указанный URL',
  args: [
    {
      name: 'url',
      type: 'string',
      description: 'URL для перенаправления',
      required: true,
    },
    {
      name: 'target',
      type: 'string',
      description: 'Цель: "_self" (текущее окно) или "_blank" (новое окно)',
      default: '_self',
    },
  ],
  execute: (args) => {
    const url = args.url;
    const target = args.target || '_self';
    if (url) {
      if (target === '_blank') {
        window.open(url, '_blank');
      } else {
        window.location.href = url;
      }
    }
  },
};

/**
 * SF3: Открыть попап
 */
export const popupAction: ActionDefinition = {
  type: 'popup',
  name: 'Открыть попап',
  description: 'Открывает модальное окно (попап)',
  args: [
    {
      name: 'content',
      type: 'string',
      description: 'HTML содержимое попапа',
      required: true,
    },
    {
      name: 'width',
      type: 'string',
      description: 'Ширина попапа (например, "500px" или "80%")',
      default: '500px',
    },
  ],
  execute: (args) => {
    const content = args.content || '';
    const width = args.width || '500px';
    
    // Создаём попап
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    `;
    
    const popup = document.createElement('div');
    popup.style.cssText = `
      background: white;
      padding: 20px;
      border-radius: 8px;
      width: ${width};
      max-width: 90%;
      max-height: 90%;
      overflow: auto;
      position: relative;
    `;
    popup.innerHTML = content;
    
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '×';
    closeBtn.style.cssText = `
      position: absolute;
      top: 10px;
      right: 10px;
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
    `;
    closeBtn.onclick = () => overlay.remove();
    
    popup.appendChild(closeBtn);
    overlay.appendChild(popup);
    overlay.onclick = (e) => {
      if (e.target === overlay) overlay.remove();
    };
    
    document.body.appendChild(overlay);
  },
};

/**
 * SF4: Прокрутка к элементу
 */
export const scrollToAction: ActionDefinition = {
  type: 'scrollTo',
  name: 'Прокрутить к элементу',
  description: 'Плавно прокручивает страницу к указанному элементу',
  args: [
    {
      name: 'selector',
      type: 'string',
      description: 'CSS селектор элемента или ID блока',
      required: true,
    },
    {
      name: 'behavior',
      type: 'string',
      description: 'Поведение: "smooth" или "instant"',
      default: 'smooth',
    },
    {
      name: 'offset',
      type: 'number',
      description: 'Смещение от верха в пикселях',
      default: 0,
    },
  ],
  execute: (args) => {
    const selector = args.selector;
    const behavior = args.behavior || 'smooth';
    const offset = args.offset || 0;
    
    if (selector) {
      const element = selector.startsWith('block-')
        ? document.querySelector(`[data-block-id="${selector}"]`)
        : document.querySelector(selector);
      
      if (element) {
        const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
        window.scrollTo({
          top: elementPosition - offset,
          behavior: behavior as ScrollBehavior,
        });
      }
    }
  },
};

export const showAction: ActionDefinition = {
  type: 'show',
  name: 'Показать элемент',
  description: 'Делает элемент видимым',
  args: [
    {
      name: 'selector',
      type: 'string',
      description: 'CSS селектор элемента или ID блока',
      required: true,
    },
  ],
  execute: (args) => {
    const selector = args.selector;
    if (selector) {
      const element = selector.startsWith('block-')
        ? document.querySelector(`[data-block-id="${selector}"]`)
        : document.querySelector(selector);
      if (element) {
        (element as HTMLElement).style.display = '';
        (element as HTMLElement).style.visibility = 'visible';
        (element as HTMLElement).style.opacity = '1';
      }
    }
  },
};

export const hideAction: ActionDefinition = {
  type: 'hide',
  name: 'Скрыть элемент',
  description: 'Скрывает элемент',
  args: [
    {
      name: 'selector',
      type: 'string',
      description: 'CSS селектор элемента или ID блока',
      required: true,
    },
  ],
  execute: (args) => {
    const selector = args.selector;
    if (selector) {
      const element = selector.startsWith('block-')
        ? document.querySelector(`[data-block-id="${selector}"]`)
        : document.querySelector(selector);
      if (element) {
        (element as HTMLElement).style.display = 'none';
      }
    }
  },
};

export const toggleAction: ActionDefinition = {
  type: 'toggle',
  name: 'Переключить видимость',
  description: 'Переключает видимость элемента (показать/скрыть)',
  args: [
    {
      name: 'selector',
      type: 'string',
      description: 'CSS селектор элемента или ID блока',
      required: true,
    },
  ],
  execute: (args) => {
    const selector = args.selector;
    if (selector) {
      const element = selector.startsWith('block-')
        ? document.querySelector(`[data-block-id="${selector}"]`)
        : document.querySelector(selector);
      if (element) {
        const isVisible = (element as HTMLElement).style.display !== 'none' &&
          window.getComputedStyle(element as HTMLElement).display !== 'none';
        (element as HTMLElement).style.display = isVisible ? 'none' : '';
      }
    }
  },
};

/**
 * SF8: Установить значение
 */
export const setValueAction: ActionDefinition = {
  type: 'setValue',
  name: 'Установить значение',
  description: 'Устанавливает значение элемента (input, textarea и т.д.)',
  args: [
    {
      name: 'selector',
      type: 'string',
      description: 'CSS селектор элемента',
      required: true,
    },
    {
      name: 'value',
      type: 'string',
      description: 'Значение для установки',
      required: true,
    },
  ],
  execute: (args) => {
    const selector = args.selector;
    const value = args.value;
    if (selector && value !== undefined) {
      const element = document.querySelector(selector) as HTMLInputElement | HTMLTextAreaElement;
      if (element) {
        element.value = String(value);
        element.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
  },
};

export const logAction: ActionDefinition = {
  type: 'log',
  name: 'Логирование',
  description: 'Выводит сообщение в консоль',
  args: [
    {
      name: 'message',
      type: 'string',
      description: 'Сообщение для вывода',
      required: true,
    },
    {
      name: 'level',
      type: 'string',
      description: 'Уровень: "log", "warn", "error"',
      default: 'log',
    },
  ],
  execute: (args) => {
    const message = args.message || '';
    const level = args.level || 'log';
    console[level as 'log' | 'warn' | 'error'](message);
  },
};

export const animateAction: ActionDefinition = {
  type: 'animate',
  name: 'Анимация',
  description: 'Применяет CSS анимацию к элементу',
  args: [
    {
      name: 'selector',
      type: 'string',
      description: 'CSS селектор элемента или ID блока',
      required: true,
    },
    {
      name: 'animation',
      type: 'string',
      description: 'Название анимации (например, "fadeIn", "slideUp")',
      required: true,
    },
    {
      name: 'duration',
      type: 'number',
      description: 'Длительность в миллисекундах',
      default: 300,
    },
  ],
  execute: (args) => {
    const selector = args.selector;
    const animation = args.animation || 'fadeIn';
    const duration = args.duration || 300;
    
    if (selector) {
      const element = selector.startsWith('block-')
        ? document.querySelector(`[data-block-id="${selector}"]`)
        : document.querySelector(selector);
      
      if (element) {
        // Простая реализация анимаций
        const animations: Record<string, string> = {
          fadeIn: 'opacity: 0; transition: opacity ' + duration + 'ms;',
          fadeOut: 'opacity: 1; transition: opacity ' + duration + 'ms;',
          slideUp: 'transform: translateY(20px); opacity: 0; transition: all ' + duration + 'ms;',
          slideDown: 'transform: translateY(-20px); opacity: 0; transition: all ' + duration + 'ms;',
        };
        
        const style = animations[animation] || animations.fadeIn;
        (element as HTMLElement).style.cssText += style;
        
        setTimeout(() => {
          (element as HTMLElement).style.opacity = '1';
          (element as HTMLElement).style.transform = 'translateY(0)';
        }, 10);
      }
    }
  },
};

// Регистр всех действий
export const actionsRegistry: Record<ActionType, ActionDefinition> = {
  changeTheme: changeThemeAction,
  redirect: redirectAction,
  popup: popupAction,
  scrollTo: scrollToAction,
  show: showAction,
  hide: hideAction,
  toggle: toggleAction,
  setValue: setValueAction,
  log: logAction,
  animate: animateAction,
  custom: {
    type: 'custom',
    name: 'Кастомное действие',
    description: 'Пользовательское действие с кастомным кодом',
    args: [],
    execute: () => {
      console.log('Кастомное действие не реализовано');
    },
  },
};

export function executeAction(type: ActionType, args: Record<string, any>): void | Promise<void> {
  const action = actionsRegistry[type];
  if (action) {
    return action.execute(args);
  } else {
    console.warn(`Действие типа "${type}" не найдено`);
  }
}

export function getActionDefinition(type: ActionType): ActionDefinition | undefined {
  return actionsRegistry[type];
}

export function getAllActions(): ActionDefinition[] {
  return Object.values(actionsRegistry).filter((a) => a.type !== 'custom');
}



