# Документация по редактору фронтенда

## Содержание

1. [Обзор архитектуры](#обзор-архитектуры)
2. [Структура проекта](#структура-проекта)
3. [Базовые блоки](#базовые-блоки)
4. [Сложные составные блоки](#сложные-составные-блоки)
5. [Взаимодействие блоков](#взаимодействие-блоков)
6. [Редактирование свойств](#редактирование-свойств)
7. [Система событий и функций](#система-событий-и-функций)
8. [Адаптивный дизайн](#адаптивный-дизайн)
9. [Добавление нового блока](#добавление-нового-блока)
10. [Drag & Drop система](#drag--drop-система)

---

## Обзор архитектуры

Редактор построен на React с использованием следующих ключевых технологий:

- **React + TypeScript** - основной фреймворк
- **Zustand** - управление состоянием
- **@dnd-kit** - система drag & drop
- **Chakra UI** - компоненты интерфейса
- **WebSocket** - синхронизация в реальном времени

### Основные компоненты

```
EditorLayout
├── Toolbar (верхняя панель инструментов)
├── BlocksPanel (левая панель блоков)
├── Workspace (центральная рабочая область)
└── PropertiesPanel (правая панель свойств)
```

### Управление состоянием

Проект использует несколько Zustand stores:

- **useProjectStore** - состояние проекта, блоков, темы
- **useLayoutStore** - размеры панелей, настройки интерфейса
- **useFunctionsStore** - функции и логика блоков
- **useTemplatesStore** - шаблоны блоков
- **useResponsiveStore** - текущий брейкпоинт (desktop/tablet/mobile)
- **useLibraryStore** - библиотека блоков

---

## Структура проекта

### Типы данных

Все типы определены в `src/types/index.ts`:

```typescript
// Базовый интерфейс блока
interface BaseBlock {
  id: string;                    // Уникальный идентификатор
  type: BlockType;               // Тип блока
  style: BlockStyle;             // Стили блока
  htmlId?: string;               // Пользовательский HTML id
  events?: {                     // Привязка функций к событиям
    [key in TriggerType]?: string[];
  };
}

// Типы блоков
type BlockType = 
  | 'text'       // Текстовый блок
  | 'image'      // Изображение
  | 'button'     // Кнопка
  | 'video'      // Видео
  | 'input'      // Текстовое поле
  | 'container'  // Контейнер (может содержать другие блоки)
  | 'grid';      // Сетка (CSS Grid)
```

### Структура проекта

```typescript
interface Project {
  projectName: string;
  header: Header;        // Шапка сайта
  blocks: Block[];       // Массив блоков
  footer: Footer;        // Подвал сайта
  theme: Theme;          // Тема оформления
}
```

---

## Базовые блоки

Базовые блоки - это простые элементы, которые не могут содержать другие блоки внутри себя.

### 1. TextBlock (Текстовый блок)

**Компонент:** `src/components/blocks/TextBlock.tsx`

**Структура:**
```typescript
interface TextBlock extends BaseBlock {
  type: 'text';
  content: string;  // Текст содержимого
}
```

**Особенности:**
- Поддерживает inline-редактирование (contentEditable)
- Автоматически сохраняет изменения при потере фокуса
- Поддерживает адаптивные стили для разных брейкпоинтов
- Может иметь привязанные события (onClick, onHover)

**Стили:**
- `color` - цвет текста
- `fontSize` - размер шрифта
- `fontWeight` - жирность (normal/bold)
- `textAlign` - выравнивание (left/center/right)
- `padding`, `margin`, `width` - отступы и размеры
- `backgroundColor` - цвет фона
- `borderRadius` - скругление углов

### 2. ImageBlock (Блок изображения)

**Компонент:** `src/components/blocks/ImageBlock.tsx`

**Структура:**
```typescript
interface ImageBlock extends BaseBlock {
  type: 'image';
  url?: string;        // URL изображения (устаревшее)
  mediaEtag?: string;  // ETag загруженного медиа
}
```

**Особенности:**
- Поддерживает загрузку изображений через медиа-библиотеку
- Использует ETag для кеширования и оптимизации
- Автоматически адаптируется под размер контейнера
- Поддерживает события onClick, onHover, onLoad

### 3. ButtonBlock (Блок кнопки)

**Компонент:** `src/components/blocks/ButtonBlock.tsx`

**Структура:**
```typescript
interface ButtonBlock extends BaseBlock {
  type: 'button';
  text: string;              // Текст кнопки
  link: string;               // Ссылка
  buttonColor?: string;       // Цвет кнопки
  variant?: 'solid' | 'radio' | 'checkbox';  // Вариант отображения
}
```

**Особенности:**
- Три варианта: обычная кнопка, радио-кнопка, чекбокс
- Поддерживает ссылки и события
- Приоритет событий над ссылками (если есть onClick событие, ссылка не работает)
- Поддерживает события: onClick, onHover, onFocus, onBlur

### 4. VideoBlock (Блок видео)

**Компонент:** `src/components/blocks/VideoBlock.tsx`

**Структура:**
```typescript
interface VideoBlock extends BaseBlock {
  type: 'video';
  url: string;  // URL видео (YouTube, Vimeo и т.д.)
}
```

**Особенности:**
- Поддерживает встраивание видео с внешних источников
- Автоматически определяет тип видео по URL

### 5. InputBlock (Текстовое поле)

**Компонент:** `src/components/blocks/InputBlock.tsx`

**Структура:**
```typescript
interface InputBlock extends BaseBlock {
  type: 'input';
  value?: string;       // Значение поля
  placeholder?: string; // Подсказка
  name?: string;        // Имя поля (для форм)
}
```

**Особенности:**
- Поддерживает события: onChange, onFocus, onBlur
- Может использоваться в формах
- Поддерживает валидацию через функции

---

## Сложные составные блоки

Составные блоки могут содержать другие блоки внутри себя, создавая иерархическую структуру.

### 1. ContainerBlock (Контейнер)

**Компонент:** `src/components/blocks/ContainerBlock.tsx`

**Структура:**
```typescript
interface ContainerBlock extends BaseBlock {
  type: 'container';
  children: Block[];  // Массив дочерних блоков
}
```

**Особенности:**

1. **Flexbox-контейнер:**
   - Поддерживает `flexDirection` (row/column/row-reverse/column-reverse)
   - Настройки `alignItems`, `justifyContent`, `flexWrap`
   - Адаптивное изменение направления на разных брейкпоинтах

2. **Drop Zones:**
   - Автоматически создает зоны для перетаскивания блоков
   - Поддерживает визуальную индикацию при наведении
   - Адаптируется под направление flex (row/column)

3. **Вложенность:**
   - Контейнеры могут содержать другие контейнеры
   - Ограничение глубины вложенности (рекомендуется не более 3-4 уровней)
   - Рекурсивный рендеринг через `BlockRenderer`

**Пример использования:**
```typescript
const containerBlock: ContainerBlock = {
  id: 'container-1',
  type: 'container',
  style: {
    display: 'flex',
    flexDirection: 'row',
    padding: '20px',
    backgroundColor: '#f5f5f5',
    responsive: {
      mobile: {
        flexDirection: 'column'  // На мобильных - вертикально
      }
    }
  },
  children: [
    { /* TextBlock */ },
    { /* ImageBlock */ },
    { /* ContainerBlock */ }  // Вложенный контейнер
  ]
};
```

### 2. GridBlock (Сетка)

**Компонент:** `src/components/blocks/GridBlock.tsx`

**Структура:**
```typescript
interface GridBlock extends BaseBlock {
  type: 'grid';
  settings: {
    columns: number;           // Количество колонок
    rows: number;              // Количество строк
    gapX: number;             // Горизонтальный отступ между ячейками (px)
    gapY: number;              // Вертикальный отступ (px)
    align?: 'start' | 'center' | 'end' | 'stretch';
    justify?: 'start' | 'center' | 'end' | 'space-between' | 'space-around' | 'space-evenly';
    placementType?: 'auto' | 'fixed' | 'fraction';
    showCellBorders?: boolean; // Показывать границы ячеек
    cellBorderColor?: string;
    cellBorderWidth?: number;
  };
  cells: GridCell[];  // Массив ячеек
}

interface GridCell {
  block: Block | null;  // Блок в ячейке (или null)
  align?: 'start' | 'center' | 'end' | 'stretch';  // Выравнивание по вертикали
  justify?: 'start' | 'center' | 'end' | 'stretch'; // Выравнивание по горизонтали
}
```

**Особенности:**

1. **CSS Grid система:**
   - Использует нативный CSS Grid
   - Автоматическая адаптация на мобильных (1 колонка)
   - На планшетах - максимум 2 колонки

2. **Ячейки:**
   - Каждая ячейка может содержать один блок
   - Индивидуальное выравнивание для каждой ячейки
   - Визуальная индикация при перетаскивании

3. **Перемещение блоков:**
   - Блоки можно перетаскивать между ячейками
   - Поддержка drag & drop из панели блоков
   - Автоматическое обновление структуры

4. **Вложенность:**
   - Ячейка может содержать ContainerBlock
   - ContainerBlock в ячейке может содержать другие блоки
   - Поддержка сложных макетов

**Пример использования:**
```typescript
const gridBlock: GridBlock = {
  id: 'grid-1',
  type: 'grid',
  style: {
    padding: '20px',
    width: '100%'
  },
  settings: {
    columns: 3,
    rows: 2,
    gapX: 16,
    gapY: 16,
    align: 'stretch',
    justify: 'start',
    showCellBorders: true,
    cellBorderColor: '#e0e0e0',
    cellBorderWidth: 1
  },
  cells: [
    { block: { /* TextBlock */ }, align: 'center', justify: 'center' },
    { block: { /* ImageBlock */ }, align: 'stretch', justify: 'stretch' },
    { block: null },  // Пустая ячейка
    { block: { /* ContainerBlock */ } },  // Контейнер в ячейке
    { block: null },
    { block: null }
  ]
};
```

---

## Взаимодействие блоков

### Иерархическая структура

Блоки образуют дерево:

```
Project
└── blocks: Block[]
    ├── TextBlock
    ├── ContainerBlock
    │   ├── TextBlock (child)
    │   ├── ImageBlock (child)
    │   └── ContainerBlock (child)
    │       └── ButtonBlock (grandchild)
    ├── GridBlock
    │   └── cells: GridCell[]
    │       ├── GridCell[0]: { block: TextBlock }
    │       ├── GridCell[1]: { block: ContainerBlock }
    │       │   └── children: [ImageBlock, ButtonBlock]
    │       └── GridCell[2]: { block: null }
    └── ImageBlock
```

### Поиск блоков

Функция `findBlockById` в `PropertiesPanel.tsx` рекурсивно ищет блок по ID:

```typescript
const findBlockById = (blocks: Block[], id: string | null): Block | undefined => {
  if (!id) return undefined;
  
  // Поиск в корневых блоках
  for (const b of blocks) {
    if (b.id === id) return b;
    
    // Поиск в контейнерах
    if (b.type === 'container' && (b as any).children) {
      const children = (b as any).children as Block[];
      const childDirect = children.find((c) => c.id === id);
      if (childDirect) return childDirect;
      const deep = findBlockById(children, id);
      if (deep) return deep;
    }
    
    // Поиск в сетках
    if (b.type === 'grid') {
      const gb = b as GridBlock;
      for (const cell of gb.cells) {
        const inner = cell?.block;
        if (!inner) continue;
        if (inner.id === id) return inner;
        const deep = findBlockById([inner], id);
        if (deep) return deep;
      }
    }
  }
  return undefined;
};
```

### Обновление блоков

Все обновления проходят через `useProjectStore.updateBlock`:

```typescript
updateBlock(blockId: string, updates: Partial<Block>): void
```

Функция:
1. Находит блок в дереве
2. Применяет обновления
3. Сохраняет в LocalStorage
4. Обновляет UI

---

## Редактирование свойств

### PropertiesPanel

**Компонент:** `src/components/PropertiesPanel.tsx`

Панель свойств отображается справа и позволяет редактировать:

1. **Выбранный блок** - если выбран блок
2. **Header** - если выбран header (selectedBlockId === 'header')
3. **Footer** - если выбран footer (selectedBlockId === 'footer')

### Секции редактирования

#### 1. Стили (Layout)

- **Отступы:** padding, margin
- **Размеры:** width, height
- **Позиционирование:** display, flexDirection, flexWrap
- **Выравнивание:** alignItems, justifyContent, textAlign
- **Скругление:** borderRadius

#### 2. Типография (Typography)

- **Шрифт:** fontSize, fontWeight
- **Цвет:** color
- **Выравнивание:** textAlign

#### 3. Фон (Background)

- **Цвет фона:** backgroundColor
- **Прозрачность:** через rgba

#### 4. Адаптивность (Responsive)

Для каждого брейкпоинта (desktop/tablet/mobile) можно задать:

```typescript
interface ResponsiveStyle {
  fontSize?: string;
  padding?: string;
  margin?: string;
  width?: string;
  textAlign?: 'left' | 'center' | 'right';
  borderRadius?: string;
  flexDirection?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
  flexWrap?: 'nowrap' | 'wrap' | 'wrap-reverse';
  display?: 'flex' | 'grid' | 'block';
  alignItems?: 'stretch' | 'flex-start' | 'center' | 'flex-end' | 'baseline';
  justifyContent?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly';
}

interface ResponsiveConfig {
  desktop?: ResponsiveStyle;
  tablet?: ResponsiveStyle;
  mobile?: ResponsiveStyle;
}
```

**Применение стилей:**

Функция `getStyleForBreakpoint` в `src/lib/responsiveUtils.ts`:

```typescript
export const getStyleForBreakpoint = (
  style: BlockStyle,
  breakpoint: Breakpoint
): ResponsiveStyle => {
  const responsive = style.responsive;
  if (!responsive) return {};
  
  // Приоритет: mobile > tablet > desktop
  if (breakpoint === 'mobile' && responsive.mobile) {
    return responsive.mobile;
  }
  if (breakpoint === 'tablet' && responsive.tablet) {
    return responsive.tablet;
  }
  if (responsive.desktop) {
    return responsive.desktop;
  }
  return {};
};
```

#### 5. Специфичные свойства блоков

**TextBlock:**
- `content` - текст содержимого

**ImageBlock:**
- Загрузка изображения через `ImageUploader`
- `mediaEtag` - ETag загруженного медиа

**ButtonBlock:**
- `text` - текст кнопки
- `link` - ссылка
- `buttonColor` - цвет кнопки
- `variant` - вариант (solid/radio/checkbox)

**VideoBlock:**
- `url` - URL видео

**InputBlock:**
- `value` - значение
- `placeholder` - подсказка
- `name` - имя поля

**ContainerBlock:**
- Настройки flexbox
- Адаптивные стили

**GridBlock:**
- `settings.columns` - количество колонок
- `settings.rows` - количество строк
- `settings.gapX`, `settings.gapY` - отступы
- `settings.align`, `settings.justify` - выравнивание
- `settings.showCellBorders` - показывать границы
- Выравнивание отдельных ячеек

#### 6. Поведение (Behavior)

- **HTML ID:** `htmlId` - пользовательский ID для DOM-элемента
- **События:** привязка функций к событиям блока

---

## Система событий и функций

### События блоков (Triggers)

**Типы событий:**
```typescript
type TriggerType = 
  | 'onClick'    // При клике
  | 'onHover'    // При наведении
  | 'onLoad'     // При загрузке
  | 'onScroll'   // При скролле
  | 'onFocus'    // При фокусе
  | 'onBlur'     // При потере фокуса
  | 'onChange'   // При изменении (для input)
  | 'onSubmit';  // При отправке формы
```

**Доступные события для блоков:**
- `button`: onClick, onHover, onFocus, onBlur
- `image`: onClick, onHover, onLoad
- `container`: onClick, onHover, onLoad
- `text`: onClick, onHover
- `input`: onChange, onFocus, onBlur

### Функции (ProjectFunction)

**Структура:**
```typescript
interface ProjectFunction {
  id: string;
  name: string;
  description?: string;
  trigger: TriggerType;        // Тип события
  blockId: string | null;       // ID блока (null = глобальная функция)
  conditions: Condition[];      // Условия выполнения
  actions: Action[];            // Действия
  type: 'visual' | 'code';      // Тип функции
  code?: string;                // Код (если type === 'code')
  enabled: boolean;             // Включена ли функция
  createdAt: number;
  updatedAt: number;
}
```

**Типы действий:**
```typescript
type ActionType = 
  | 'changeTheme'  // Изменить тему
  | 'redirect'     // Перенаправить
  | 'popup'        // Показать попап
  | 'scrollTo'     // Прокрутить к элементу
  | 'toggle'       // Переключить видимость
  | 'show'         // Показать элемент
  | 'hide'         // Скрыть элемент
  | 'animate'      // Анимация
  | 'setValue'     // Установить значение
  | 'log'          // Логирование
  | 'custom';      // Пользовательский код
```

**Привязка к блоку:**
```typescript
interface BaseBlock {
  events?: {
    [key in TriggerType]?: string[];  // Массив ID функций
  };
}
```

**Пример:**
```typescript
const buttonBlock: ButtonBlock = {
  id: 'btn-1',
  type: 'button',
  text: 'Нажми меня',
  link: '#',
  events: {
    onClick: ['func-1', 'func-2']  // Выполнить две функции при клике
  }
};
```

**Выполнение функций:**

Функция `executeBlockEventFunctions` в `src/lib/functionExecutor.ts`:

```typescript
export const executeBlockEventFunctions = (
  blockId: string,
  trigger: TriggerType,
  events?: { [key in TriggerType]?: string[] }
): void => {
  if (!events || !events[trigger]) return;
  
  const functionIds = events[trigger];
  if (!functionIds || functionIds.length === 0) return;
  
  // Получаем функции из store
  const functions = useFunctionsStore.getState().functions;
  
  // Выполняем каждую функцию
  functionIds.forEach(funcId => {
    const func = functions.find(f => f.id === funcId && f.enabled);
    if (func) {
      executeFunction(func);
    }
  });
};
```

---

## Адаптивный дизайн

### Брейкпоинты

Система использует три брейкпоинта:

- **desktop** - десктоп (по умолчанию)
- **tablet** - планшет
- **mobile** - мобильный

**Управление:** `useResponsiveStore`

```typescript
interface ResponsiveStore {
  currentBreakpoint: Breakpoint;
  setBreakpoint: (breakpoint: Breakpoint) => void;
}
```

### Адаптивные стили

Каждый блок может иметь адаптивные стили:

```typescript
const block: TextBlock = {
  id: 'text-1',
  type: 'text',
  content: 'Адаптивный текст',
  style: {
    fontSize: '24px',  // Десктоп
    padding: '20px',
    responsive: {
      tablet: {
        fontSize: '20px',  // Планшет
        padding: '16px'
      },
      mobile: {
        fontSize: '16px',  // Мобильный
        padding: '12px',
        textAlign: 'center'
      }
    }
  }
};
```

### Автоматическая адаптация

**GridBlock:**
- На мобильных: всегда 1 колонка
- На планшетах: максимум 2 колонки
- На десктопе: заданное количество колонок

**ContainerBlock:**
- Может менять `flexDirection` на разных брейкпоинтах
- Например: `row` на десктопе → `column` на мобильном

---

## Добавление нового блока

### Шаг 1: Определение типа

В `src/types/index.ts`:

```typescript
// Добавить в BlockType
type BlockType = 
  | 'text'
  | 'image'
  | 'button'
  | 'video'
  | 'input'
  | 'container'
  | 'grid'
  | 'myNewBlock';  // Новый тип

// Создать интерфейс
export interface MyNewBlock extends BaseBlock {
  type: 'myNewBlock';
  // Специфичные свойства
  myProperty: string;
  myNumber: number;
}
```

### Шаг 2: Создание компонента

Создать файл `src/components/blocks/MyNewBlock.tsx`:

```typescript
import { Box } from '@chakra-ui/react';
import type { MyNewBlock as MyNewBlockType } from '../../types';
import { useProjectStore } from '../../store/useProjectStore';
import { useResponsiveStore } from '../../store/useResponsiveStore';
import { getStyleForBreakpoint } from '../../lib/responsiveUtils';

interface MyNewBlockProps {
  block: MyNewBlockType;
  isSelected: boolean;
  isPreview: boolean;
}

export const MyNewBlock = ({ block, isSelected, isPreview }: MyNewBlockProps) => {
  const { selectBlock, deleteBlock, project } = useProjectStore();
  const { currentBreakpoint } = useResponsiveStore();
  const responsiveStyle = getStyleForBreakpoint(block.style, currentBreakpoint);

  const handleClick = (e: React.MouseEvent) => {
    if (!isPreview) {
      e.stopPropagation();
      selectBlock(block.id);
    }
  };

  return (
    <Box
      id={block.htmlId || undefined}
      data-block-id={block.id}
      onClick={handleClick}
      border="1px dashed transparent"
      style={{
        ...block.style,
        padding: responsiveStyle.padding || block.style.padding,
        margin: responsiveStyle.margin || block.style.margin,
        width: responsiveStyle.width || block.style.width,
        boxShadow: isSelected && !isPreview ? `0 0 0 2px ${project.theme.accent}` : 'none',
      }}
      _hover={{
        border: !isPreview ? '1px dashed var(--app-border)' : 'none',
      }}
    >
      {/* Ваш контент */}
      <Box>{block.myProperty}</Box>
      
      {/* Кнопка удаления (только в режиме редактирования) */}
      {!isPreview && (
        <Box
          className="delete-btn"
          position="absolute"
          top="5px"
          right="5px"
          backgroundColor="var(--app-surface)"
          color="var(--app-text-muted)"
          padding="6px"
          borderRadius="6px"
          border="1px solid var(--app-border)"
          cursor="pointer"
          display="none"
          _hover={{ backgroundColor: 'var(--app-hover)', color: 'var(--app-accent)' }}
          onClick={(e) => {
            e.stopPropagation();
            deleteBlock(block.id);
          }}
        >
          <Trash2 size={14} />
        </Box>
      )}
    </Box>
  );
};
```

### Шаг 3: Регистрация в BlockRenderer

В `src/components/blocks/BlockRenderer.tsx`:

```typescript
import { MyNewBlock } from './MyNewBlock';

export const BlockRenderer = ({ block, isPreview = false }: BlockRendererProps) => {
  // ...
  switch (block.type) {
    // ...
    case 'myNewBlock':
      return <MyNewBlock block={block} isSelected={isSelected} isPreview={isPreview} />;
    default:
      return null;
  }
};
```

### Шаг 4: Создание функции создания блока

В `src/store/project/blockCreators.ts`:

```typescript
export const createNewBlock = (type: BlockType, theme?: Theme): Block => {
  // ...
  switch (type) {
    // ...
    case 'myNewBlock':
      return {
        ...baseBlock,
        type: 'myNewBlock',
        myProperty: 'Значение по умолчанию',
        myNumber: 0,
        style: {
          ...baseBlock.style,
          // Стили по умолчанию
        },
      } as Block;
  }
};
```

### Шаг 5: Добавление в панель блоков

В `src/components/BlocksPanel.tsx`:

```typescript
const blockTypes: { type: BlockType; label: string; icon: JSX.Element }[] = [
  // ...
  { type: 'myNewBlock', label: 'Мой новый блок', icon: <MyIcon size={16} /> },
];
```

### Шаг 6: Редактирование свойств

В `src/components/PropertiesPanel.tsx`:

```typescript
// В функции рендеринга панели свойств
if (selectedBlock?.type === 'myNewBlock') {
  return (
    <VStack gap="16px" align="stretch">
      {/* Общие стили */}
      {/* ... */}
      
      {/* Специфичные свойства */}
      <Box>
        <Text fontSize="14px" marginBottom="8px">My Property</Text>
        <Input
          value={(selectedBlock as MyNewBlock).myProperty}
          onChange={(e) => updateBlockAndSave(selectedBlock.id, {
            myProperty: e.target.value
          })}
        />
      </Box>
      
      <Box>
        <Text fontSize="14px" marginBottom="8px">My Number</Text>
        <Input
          type="number"
          value={(selectedBlock as MyNewBlock).myNumber}
          onChange={(e) => updateBlockAndSave(selectedBlock.id, {
            myNumber: parseInt(e.target.value, 10)
          })}
        />
      </Box>
    </VStack>
  );
}
```

### Шаг 7: Обновление типов в useProjectStore

В `src/store/project/useProjectStore.ts`:

```typescript
type UpdatePayload =
  | Partial<TextBlock>
  | Partial<ImageBlock>
  // ...
  | Partial<MyNewBlock>  // Добавить
  | Partial<Block>;
```

---

## Drag & Drop система

### Архитектура

Используется библиотека `@dnd-kit`:

- **DndProvider** - обертка для всего редактора
- **useDraggable** - для элементов, которые можно перетаскивать
- **useDroppable** - для зон, куда можно бросать
- **useSortable** - для сортировки блоков

### Компоненты

**1. DndProvider** (`src/components/DndProvider.tsx`)

Обрабатывает все события drag & drop:

- Перетаскивание новых блоков из панели
- Перемещение существующих блоков
- Добавление в контейнеры
- Добавление в ячейки сетки
- Перемещение между ячейками сетки

**2. SortableBlock** (`src/components/SortableBlock.tsx`)

Обертка для блоков с поддержкой drag & drop:

```typescript
const {
  attributes,
  listeners,
  setNodeRef,
  transform,
  transition,
  isDragging,
} = useSortable({
  id: block.id,
  disabled: isPreview,
});
```

**3. DropZone** (`src/components/Workspace.tsx`)

Зоны для добавления блоков между существующими:

```typescript
const DropZone = ({ id, isEmpty = false }) => {
  const { setNodeRef, isOver } = useDroppable({ id });
  // Визуальная индикация при наведении
};
```

**4. InnerDropZone** (`src/components/blocks/ContainerBlock.tsx`)

Зоны внутри контейнеров для добавления дочерних блоков.

### Логика обработки

**Добавление нового блока:**

1. Пользователь перетаскивает блок из панели
2. `DndProvider` определяет целевую зону (workspace/container/grid)
3. Вызывается соответствующая функция:
   - `addBlock` - для workspace
   - `addBlockToContainer` - для контейнера
   - `addBlockToGridCell` - для ячейки сетки

**Перемещение существующего блока:**

1. Пользователь перетаскивает блок за ручку (⋮⋮)
2. `DndProvider` определяет новую позицию
3. Вызывается `moveBlock` или `moveGridItem`

**Ограничения:**

- Контейнеры не могут быть перетащены в свои дочерние элементы
- Сетки не могут быть перетащены в свои ячейки
- Ограничение глубины вложенности (рекомендуется)

---

## Дополнительные возможности

### Шаблоны блоков

Пользователи могут сохранять группы блоков как шаблоны:

```typescript
interface BlockTemplate {
  id: string;
  name: string;
  description?: string;
  category?: string;
  preview?: string;
  blocks: Block[];  // Массив блоков
  createdAt: number;
  isCustom?: boolean;
}
```

**Использование:**
- Сохранение через панель блоков
- Добавление через библиотеку блоков
- Автоматическое применение темы при добавлении

### Экспорт/Импорт

**Экспорт проекта:**
- JSON формат
- Включает все блоки, тему, функции
- Через Toolbar → Экспорт JSON

**Импорт проекта:**
- Загрузка JSON файла
- Восстановление структуры проекта
- Через Toolbar → Импорт JSON

### WebSocket синхронизация

**Компонент:** `src/lib/useWebSocketSync.ts`

Синхронизация изменений в реальном времени:

- Отправка изменений на сервер
- Получение изменений от других пользователей
- Обновление UI при получении изменений
- Управление конфликтами

### Presence (курсоры)

**Компонент:** `src/lib/usePresence.ts`

Отображение курсоров других пользователей:

- Позиция курсора
- Имя пользователя
- Цвет курсора

---

## Рекомендации по разработке

### Производительность

1. **Мемоизация:**
   - Используйте `useMemo` для вычисляемых значений
   - Используйте `React.memo` для компонентов блоков

2. **Оптимизация рендеринга:**
   - Блоки рендерятся только при изменении
   - Используйте селекторы Zustand для подписки на изменения

3. **Ленивая загрузка:**
   - Изображения загружаются по требованию
   - Видео встраиваются только при необходимости

### Доступность

1. **ARIA атрибуты:**
   - `aria-label` для кнопок
   - `data-block-id` для идентификации

2. **Клавиатурная навигация:**
   - Поддержка Tab для навигации
   - Enter для активации
   - Escape для отмены

### Тестирование

1. **Unit тесты:**
   - Функции создания блоков
   - Утилиты работы с блоками
   - Функции поиска блоков

2. **Интеграционные тесты:**
   - Drag & Drop
   - Редактирование свойств
   - Сохранение/загрузка

---

## Заключение

Эта документация описывает архитектуру и работу редактора. Для более детальной информации смотрите исходный код компонентов и утилит.

**Ключевые файлы для изучения:**

- `src/types/index.ts` - все типы
- `src/store/project/useProjectStore.ts` - управление проектом
- `src/components/blocks/BlockRenderer.tsx` - рендеринг блоков
- `src/components/PropertiesPanel.tsx` - редактирование свойств
- `src/components/DndProvider.tsx` - drag & drop логика
- `src/lib/responsiveUtils.ts` - адаптивные утилиты
- `src/lib/functionExecutor.ts` - выполнение функций

