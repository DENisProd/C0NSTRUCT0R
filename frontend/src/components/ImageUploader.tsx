import { Box, Button, VStack, HStack, Text, Input } from '@chakra-ui/react';
import { useState, useRef, useCallback } from 'react';
import { Upload, X, Check } from 'lucide-react';
import { uploadProjectMedia, getMediaUrlByEtag } from '../lib/api/media';

interface ImageUploaderProps {
  projectId: number;
  currentUrl?: string;
  currentEtag?: string;
  onImageSelected: (etag: string, url: string) => void;
  onRemove?: () => void;
  cropAspectRatio?: number; // Соотношение сторон для обрезки (width/height)
}

export const ImageUploader = ({
  projectId,
  currentUrl,
  currentEtag,
  onImageSelected,
  onRemove,
  cropAspectRatio,
}: ImageUploaderProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isCropping, setIsCropping] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [cropData, setCropData] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleFileSelect = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Пожалуйста, выберите файл изображения');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string;
      setPreviewUrl(url);
      setIsCropping(true);
      
      // Загружаем изображение для обрезки
      const img = new Image();
      img.onload = () => {
        imageRef.current = img;
        // Инициализируем область обрезки
        const containerWidth = 400; // Ширина контейнера для обрезки
        const containerHeight = 300;
        
        // Масштабируем изображение для отображения в контейнере
        const imageAspectRatio = img.width / img.height;
        const containerAspectRatio = containerWidth / containerHeight;
        
        let displayWidth: number;
        let displayHeight: number;
        
        if (imageAspectRatio > containerAspectRatio) {
          displayWidth = containerWidth;
          displayHeight = containerWidth / imageAspectRatio;
        } else {
          displayHeight = containerHeight;
          displayWidth = containerHeight * imageAspectRatio;
        }
        
        let cropWidth: number;
        let cropHeight: number;
        
        if (cropAspectRatio) {
          // Вычисляем размеры обрезки с учетом соотношения сторон
          if (displayWidth / displayHeight > cropAspectRatio) {
            cropHeight = Math.min(displayHeight, containerHeight);
            cropWidth = cropHeight * cropAspectRatio;
          } else {
            cropWidth = Math.min(displayWidth, containerWidth);
            cropHeight = cropWidth / cropAspectRatio;
          }
        } else {
          // Используем размеры отображения изображения
          cropWidth = Math.min(displayWidth, containerWidth);
          cropHeight = Math.min(displayHeight, containerHeight);
        }
        
        const x = (containerWidth - cropWidth) / 2;
        const y = (containerHeight - cropHeight) / 2;
        
        setCropData({
          x,
          y,
          width: cropWidth,
          height: cropHeight,
        });
      };
      img.src = url;
    };
    reader.readAsDataURL(file);
  }, [cropAspectRatio]);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleContainerMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cropData || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Проверяем, клик внутри области обрезки
    if (
      x >= cropData.x &&
      x <= cropData.x + cropData.width &&
      y >= cropData.y &&
      y <= cropData.y + cropData.height
    ) {
      setIsDragging(true);
      setDragStart({ x: x - cropData.x, y: y - cropData.y });
    }
  };

  const handleContainerMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !cropData || !dragStart || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - dragStart.x;
    const y = e.clientY - rect.top - dragStart.y;
    
    const containerWidth = 400;
    const containerHeight = 300;
    
    // Ограничиваем перемещение границами контейнера
    const newX = Math.max(0, Math.min(x, containerWidth - cropData.width));
    const newY = Math.max(0, Math.min(y, containerHeight - cropData.height));
    
    setCropData({
      ...cropData,
      x: newX,
      y: newY,
    });
  };

  const handleContainerMouseUp = () => {
    setIsDragging(false);
    setDragStart(null);
  };

  const handleResize = (direction: 'nw' | 'ne' | 'sw' | 'se', e: React.MouseEvent) => {
    e.stopPropagation();
    if (!cropData || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    const startCrop = { ...cropData };
    
    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
      
      let newX = startCrop.x;
      let newY = startCrop.y;
      let newWidth = startCrop.width;
      let newHeight = startCrop.height;
      
      const containerWidth = 400;
      const containerHeight = 300;
      
      if (direction.includes('e')) {
        newWidth = Math.max(50, Math.min(startCrop.width + deltaX, containerWidth - startCrop.x));
      }
      if (direction.includes('w')) {
        const newDeltaX = -deltaX;
        newX = Math.max(0, startCrop.x + newDeltaX);
        newWidth = Math.max(50, startCrop.width - newDeltaX);
      }
      if (direction.includes('s')) {
        newHeight = Math.max(50, Math.min(startCrop.height + deltaY, containerHeight - startCrop.y));
      }
      if (direction.includes('n')) {
        const newDeltaY = -deltaY;
        newY = Math.max(0, startCrop.y + newDeltaY);
        newHeight = Math.max(50, startCrop.height - newDeltaY);
      }
      
      // Поддерживаем соотношение сторон, если задано
      if (cropAspectRatio) {
        if (direction.includes('e') || direction.includes('w')) {
          newHeight = newWidth / cropAspectRatio;
          if (newY + newHeight > containerHeight) {
            newHeight = containerHeight - newY;
            newWidth = newHeight * cropAspectRatio;
          }
        } else {
          newWidth = newHeight * cropAspectRatio;
          if (newX + newWidth > containerWidth) {
            newWidth = containerWidth - newX;
            newHeight = newWidth / cropAspectRatio;
          }
        }
      }
      
      setCropData({
        x: newX,
        y: newY,
        width: newWidth,
        height: newHeight,
      });
    };
    
    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
    
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const handleCrop = useCallback(async () => {
    if (!imageRef.current || !cropData || !previewUrl) return;
    
    setIsUploading(true);
    
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      const img = imageRef.current;
      const containerWidth = 400;
      const containerHeight = 300;
      
      // Вычисляем масштаб отображения изображения в контейнере
      const imageAspectRatio = img.width / img.height;
      const containerAspectRatio = containerWidth / containerHeight;
      
      let displayWidth: number;
      let displayHeight: number;
      let offsetX = 0;
      let offsetY = 0;
      
      if (imageAspectRatio > containerAspectRatio) {
        displayWidth = containerWidth;
        displayHeight = containerWidth / imageAspectRatio;
        offsetY = (containerHeight - displayHeight) / 2;
      } else {
        displayHeight = containerHeight;
        displayWidth = containerHeight * imageAspectRatio;
        offsetX = (containerWidth - displayWidth) / 2;
      }
      
      // Вычисляем реальные координаты обрезки на исходном изображении
      const scaleX = img.width / displayWidth;
      const scaleY = img.height / displayHeight;
      
      // Учитываем смещение изображения в контейнере
      const sourceX = (cropData.x - offsetX) * scaleX;
      const sourceY = (cropData.y - offsetY) * scaleY;
      const sourceWidth = cropData.width * scaleX;
      const sourceHeight = cropData.height * scaleY;
      
      // Ограничиваем координаты границами изображения
      const finalX = Math.max(0, Math.min(sourceX, img.width));
      const finalY = Math.max(0, Math.min(sourceY, img.height));
      const finalWidth = Math.max(1, Math.min(sourceWidth, img.width - finalX));
      const finalHeight = Math.max(1, Math.min(sourceHeight, img.height - finalY));
      
      canvas.width = finalWidth;
      canvas.height = finalHeight;
      
      ctx.drawImage(
        img,
        finalX,
        finalY,
        finalWidth,
        finalHeight,
        0,
        0,
        finalWidth,
        finalHeight
      );
      
      // Конвертируем canvas в blob и затем в File
      canvas.toBlob(async (blob) => {
        if (!blob) {
          setIsUploading(false);
          return;
        }
        
        const file = new File([blob], 'cropped-image.png', { type: 'image/png' });
        
        try {
          const media = await uploadProjectMedia(projectId, file);
          if (media.etag) {
            const url = media.file_url || getMediaUrlByEtag(media.etag);
            onImageSelected(media.etag, url);
            setIsCropping(false);
            setPreviewUrl(null);
            setCropData(null);
          }
        } catch (error) {
          console.error('Ошибка загрузки изображения:', error);
          alert('Ошибка загрузки изображения');
        } finally {
          setIsUploading(false);
        }
      }, 'image/png');
    } catch (error) {
      console.error('Ошибка обрезки изображения:', error);
      alert('Ошибка обрезки изображения');
      setIsUploading(false);
    }
  }, [cropData, previewUrl, projectId, onImageSelected]);

  const handleCancelCrop = () => {
    setIsCropping(false);
    setPreviewUrl(null);
    setCropData(null);
    imageRef.current = null;
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (isCropping && previewUrl) {
    return (
      <VStack gap="12px" align="stretch">
        <Text fontSize="14px" fontWeight="medium">
          Обрезка изображения
        </Text>
        <Box
          ref={containerRef}
          position="relative"
          width="400px"
          height="300px"
          border="2px solid #e0e0e0"
          borderRadius="8px"
          overflow="hidden"
          cursor={isDragging ? 'grabbing' : 'grab'}
          onMouseDown={handleContainerMouseDown}
          onMouseMove={handleContainerMouseMove}
          onMouseUp={handleContainerMouseUp}
          onMouseLeave={handleContainerMouseUp}
        >
          <img
            src={previewUrl}
            alt="Preview"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
            }}
          />
          {cropData && (
            <>
              {/* Затемнение вне области обрезки */}
              <Box
                position="absolute"
                top={0}
                left={0}
                width="100%"
                height="100%"
                backgroundColor="rgba(0, 0, 0, 0.5)"
                clipPath={`polygon(
                  0% 0%, 
                  0% 100%, 
                  ${cropData.x}px 100%, 
                  ${cropData.x}px ${cropData.y}px, 
                  ${cropData.x + cropData.width}px ${cropData.y}px, 
                  ${cropData.x + cropData.width}px ${cropData.y + cropData.height}px, 
                  ${cropData.x}px ${cropData.y + cropData.height}px, 
                  ${cropData.x}px 100%, 
                  100% 100%, 
                  100% 0%
                )`}
                pointerEvents="none"
              />
              {/* Рамка обрезки */}
              <Box
                position="absolute"
                left={`${cropData.x}px`}
                top={`${cropData.y}px`}
                width={`${cropData.width}px`}
                height={`${cropData.height}px`}
                border="2px solid #3182ce"
                boxShadow="0 0 0 1px rgba(255, 255, 255, 0.5)"
                pointerEvents="none"
              />
              {/* Углы для изменения размера */}
              {['nw', 'ne', 'sw', 'se'].map((corner) => (
                <Box
                  key={corner}
                  position="absolute"
                  left={
                    corner.includes('w')
                      ? `${cropData.x - 4}px`
                      : `${cropData.x + cropData.width - 4}px`
                  }
                  top={
                    corner.includes('n')
                      ? `${cropData.y - 4}px`
                      : `${cropData.y + cropData.height - 4}px`
                  }
                  width="8px"
                  height="8px"
                  backgroundColor="#3182ce"
                  border="2px solid white"
                  borderRadius="2px"
                  cursor={`${corner}-resize`}
                  onMouseDown={(e) => handleResize(corner as 'nw' | 'ne' | 'sw' | 'se', e)}
                />
              ))}
            </>
          )}
        </Box>
        <HStack gap="8px">
          <Button
            size="sm"
            colorScheme="blue"
            onClick={handleCrop}
            loading={isUploading}
          >
            <HStack gap="6px" align="center">
              <Check size={16} />
              <Box as="span">Применить</Box>
            </HStack>
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleCancelCrop}
          >
            <HStack gap="6px" align="center">
              <X size={16} />
              <Box as="span">Отмена</Box>
            </HStack>
          </Button>
        </HStack>
      </VStack>
    );
  }

  return (
    <VStack gap="12px" align="stretch">
      {currentUrl || currentEtag ? (
        <Box>
          <Box
            position="relative"
            width="100%"
            maxHeight="200px"
            borderRadius="8px"
            overflow="hidden"
            border="1px solid #e0e0e0"
          >
            <img
              src={currentUrl || (currentEtag ? getMediaUrlByEtag(currentEtag) : '')}
              alt="Current"
              style={{
                width: '100%',
                height: 'auto',
                display: 'block',
              }}
            />
          </Box>
          <HStack gap="8px" marginTop="8px">
            <Button
              size="sm"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
            >
              <HStack gap="6px" align="center">
                <Upload size={16} />
                <Box as="span">Заменить</Box>
              </HStack>
            </Button>
            {onRemove && (
              <Button
                size="sm"
                variant="outline"
                colorScheme="red"
                onClick={onRemove}
              >
                <HStack gap="6px" align="center">
                  <X size={16} />
                  <Box as="span">Удалить</Box>
                </HStack>
              </Button>
            )}
          </HStack>
        </Box>
      ) : (
        <Box
          border="2px dashed #e0e0e0"
          borderRadius="8px"
          padding="40px"
          textAlign="center"
          backgroundColor="#f9f9f9"
          cursor="pointer"
          _hover={{ borderColor: '#3182ce', backgroundColor: '#f0f7ff' }}
          onClick={() => fileInputRef.current?.click()}
        >
          <VStack gap="8px">
            <Upload size={32} color="#999" />
            <Text color="#666" fontSize="14px">
              Нажмите для загрузки изображения
            </Text>
            <Text color="#999" fontSize="12px">
              Поддерживаются форматы: JPG, PNG, GIF, WebP
            </Text>
          </VStack>
        </Box>
      )}
      <Input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInputChange}
        style={{ display: 'none' }}
      />
    </VStack>
  );
};

