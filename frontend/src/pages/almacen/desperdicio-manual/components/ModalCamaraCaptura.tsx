import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Zoom,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { Button } from '../../../../components/common/Button';
import { showAlert } from '../../../../config/alerts';

interface ModalCamaraCapturaProps {
  open: boolean;
  onClose: () => void;
  onCapture: (
    base64: string,
    previewUrl: string,
    fileName: string,
    tipo?: 'image' | 'pdf'
  ) => void;
}

interface CapturedItem {
  dataUrl: string;
  base64: string;
  fileName: string;
  tipo: 'image' | 'pdf';
}

export const ModalCamaraCaptura: React.FC<ModalCamaraCapturaProps> = ({
  open,
  onClose,
  onCapture,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [capturedItem, setCapturedItem] = useState<CapturedItem | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Detener la cámara
  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  // Iniciar flujo de video
  const startCamera = async (deviceId?: string) => {
    setIsLoading(true);
    setErrorMsg(null);
    stopCameraStream();

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Su navegador no soporta acceso a la cámara.');
      }

      const constraints: MediaStreamConstraints = {
        video: deviceId
          ? { deviceId: { exact: deviceId } }
          : {
            facingMode: { ideal: 'environment' }, // Cámara trasera en móviles
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setIsLoading(false);
        };
      }

      // Detectar cámaras disponibles en PC o móvil
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter((d) => d.kind === 'videoinput');
      setAvailableCameras(videoDevices);

      if (!deviceId && videoDevices.length > 0) {
        // Seleccionar la cámara activa
        const currentTrack = stream.getVideoTracks()[0];
        const currentSettings = currentTrack?.getSettings();
        if (currentSettings?.deviceId) {
          setSelectedCameraId(currentSettings.deviceId);
        } else {
          setSelectedCameraId(videoDevices[0].deviceId);
        }
      }
    } catch (err: any) {
      console.error('Error al acceder a la cámara:', err);
      setIsLoading(false);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMsg('Permiso de cámara denegado. Habilite el acceso a la cámara en los permisos de su navegador.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setErrorMsg('No se detectó ninguna cámara disponible en este dispositivo.');
      } else {
        setErrorMsg('No fue posible conectar con la cámara: ' + (err.message || 'Error desconocido'));
      }
    }
  };

  // Iniciar cámara al abrir modal y detener al cerrar
  useEffect(() => {
    if (open) {
      setCapturedItem(null);
      startCamera();
    } else {
      stopCameraStream();
    }
    return () => {
      stopCameraStream();
    };
  }, [open]);

  // Cambiar de cámara
  const handleCameraChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newId = e.target.value;
    setSelectedCameraId(newId);
    setCapturedItem(null);
    startCamera(newId);
  };

  // Alternar entre cámaras
  const handleToggleNextCamera = () => {
    if (availableCameras.length <= 1) return;
    const currentIndex = availableCameras.findIndex((c) => c.deviceId === selectedCameraId);
    const nextIndex = (currentIndex + 1) % availableCameras.length;
    const nextCamera = availableCameras[nextIndex];
    setSelectedCameraId(nextCamera.deviceId);
    setCapturedItem(null);
    startCamera(nextCamera.deviceId);
  };

  // Capturar fotograma desde la cámara
  const handleCapturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      const base64 = dataUrl.split(',')[1];
      setCapturedItem({
        dataUrl,
        base64,
        fileName: `foto_evidencia_${Date.now()}.jpg`,
        tipo: 'image',
      });
    }
  };

  // Cargar archivo o documento PDF desde disco/galería
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

    if (!isImage && !isPdf) {
      showAlert.warning('Formato No Válido', 'Solo se permiten imágenes o documentos PDF.');
      return;
    }

    if (isPdf) {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
        setCapturedItem({
          dataUrl,
          base64,
          fileName: file.name,
          tipo: 'pdf',
        });
        stopCameraStream();
      };
      reader.readAsDataURL(file);
    } else {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const rawDataUrl = ev.target?.result as string;
        const img = new Image();
        img.onload = () => {
          const maxDim = 1280;
          let width = img.width;
          let height = img.height;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          const base64 = compressedDataUrl.split(',')[1];
          setCapturedItem({
            dataUrl: compressedDataUrl,
            base64,
            fileName: file.name,
            tipo: 'image',
          });
          stopCameraStream();
        };
        img.src = rawDataUrl;
      };
      reader.readAsDataURL(file);
    }

    e.target.value = '';
  };

  // Repetir foto o volver a la cámara
  const handleRetake = () => {
    setCapturedItem(null);
    startCamera(selectedCameraId);
  };

  // Confirmar y guardar foto o PDF
  const handleConfirm = () => {
    if (!capturedItem) return;
    onCapture(
      capturedItem.base64,
      capturedItem.dataUrl,
      capturedItem.fileName,
      capturedItem.tipo
    );
    stopCameraStream();
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={() => {
        stopCameraStream();
        onClose();
      }}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            width: isMobile ? '100%' : undefined,
            m: isMobile ? 1 : 2,
            borderRadius: isMobile ? 0 : '1.75rem',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            bgcolor: 'var(--surface, #ffffff)',
            color: 'var(--on-surface, #18181b)',
            border: isMobile ? 'none' : '1px solid var(--border-outline-variant, #e4e4e7)',
          },
        },
      }}
    >
      {/* ── Encabezado del Modal de Cámara / PDF ── */}
      <DialogTitle
        sx={{
          p: 2,
          px: 2.5,
          borderBottom: '1px solid var(--border-outline-variant, #f4f4f5)',
          bgcolor: 'var(--surface, #ffffff)',
        }}
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-primary text-white flex items-center justify-center shadow-md shadow-primary/20 shrink-0">
              <span className="material-symbols-outlined text-lg">
                {capturedItem?.tipo === 'pdf' ? 'picture_as_pdf' : 'photo_camera'}
              </span>
            </div>
            <div>
              <p className="text-[9px] font-black text-primary uppercase tracking-[0.15em] leading-none mb-0.5 font-headline">
                EVIDENCIA DE DESPERDICIO
              </p>
              <h3 className="text-base font-black text-on-surface uppercase tracking-tight leading-none font-headline">
                {capturedItem
                  ? capturedItem.tipo === 'pdf'
                    ? 'VISTA PREVIA DEL PDF'
                    : 'VISTA PREVIA DE LA FOTO'
                  : 'TOMAR FOTO / SUBIR ARCHIVO'}
              </h3>
            </div>
          </div>
          <IconButton
            onClick={() => {
              stopCameraStream();
              onClose();
            }}
            size="small"
            sx={{
              color: 'var(--on-surface-variant)',
              bgcolor: 'var(--surface-variant, #f4f4f5)',
              '&:hover': { opacity: 0.8 },
            }}
          >
            <span className="material-symbols-outlined text-base">close</span>
          </IconButton>
        </div>
      </DialogTitle>

      {/* ── Cuerpo del Visor (Cámara, Foto o PDF) ── */}
      <DialogContent sx={{ p: 2, bgcolor: 'var(--surface, #ffffff)' }}>
        <div className="space-y-3">
          {/* Barra de opciones (Cambio de cámara y Subida directa de PDF/Archivo) */}
          {!capturedItem && (
            <div className="flex flex-wrap items-center justify-between gap-2 bg-surface-variant/40 dark:bg-zinc-800/40 p-2 rounded-xl border border-outline-variant/60">
              {availableCameras.length > 1 ? (
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="material-symbols-outlined text-primary text-sm shrink-0">videocam</span>
                  <select
                    value={selectedCameraId}
                    onChange={handleCameraChange}
                    className="bg-transparent text-[10px] font-black uppercase text-on-surface outline-none cursor-pointer truncate max-w-[150px]"
                  >
                    {availableCameras.map((cam, idx) => (
                      <option key={cam.deviceId || idx} value={cam.deviceId} className="dark:bg-zinc-900">
                        {cam.label || `Cámara ${idx + 1}`}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={handleToggleNextCamera}
                    title="Alternar Cámara"
                    className="px-2 py-1 rounded-lg bg-primary/10 hover:bg-primary text-primary hover:text-white text-[9px] font-black uppercase flex items-center gap-1 transition-all cursor-pointer shrink-0 ml-1"
                  >
                    <span className="material-symbols-outlined text-xs">flip_camera_ios</span>
                  </button>
                </div>
              ) : (
                <span className="text-[10px] font-bold text-zinc-500 uppercase ml-1">
                  Cámara activa
                </span>
              )}

              {/* Botón para subir PDF o Foto desde archivo */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 hover:border-primary text-zinc-700 dark:text-zinc-200 text-[10px] font-black uppercase flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
              >
                <span className="material-symbols-outlined text-sm text-primary">upload_file</span>
                <span>Subir PDF / Foto</span>
              </button>
            </div>
          )}

          {/* Input oculto para subir PDF o Imagen */}
          <input
            type="file"
            ref={fileInputRef}
            accept="image/png,image/jpeg,image/jpg,image/webp,application/pdf"
            onChange={handleFileUpload}
            className="hidden"
          />

          {/* Área de Visualización (Stream de Video, Imagen Capturada o Visor PDF) */}
          <div className="relative w-full bg-black rounded-2xl overflow-hidden min-h-[320px] max-h-[460px] flex items-center justify-center shadow-inner border border-zinc-800">
            {errorMsg && !capturedItem ? (
              <div className="p-4 text-center text-red-400 space-y-2 max-w-sm">
                <span className="material-symbols-outlined text-4xl block">videocam_off</span>
                <p className="text-xs font-bold leading-snug">{errorMsg}</p>
                <div className="flex justify-center gap-2 pt-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => startCamera(selectedCameraId)}
                    icon="refresh"
                    className="!h-8 !px-3 text-[10px]"
                  >
                    Reintentar Cámara
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    icon="upload_file"
                    className="!h-8 !px-3 text-[10px]"
                  >
                    Subir PDF / Foto
                  </Button>
                </div>
              </div>
            ) : capturedItem ? (
              capturedItem.tipo === 'pdf' ? (
                <iframe
                  src={capturedItem.dataUrl}
                  title={capturedItem.fileName}
                  className="w-full h-[400px] rounded-xl border-none bg-white"
                />
              ) : (
                <img
                  src={capturedItem.dataUrl}
                  alt="Vista Previa"
                  className="w-full h-auto max-h-[460px] object-contain"
                />
              )
            ) : (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />

                {/* Guía de encuadre */}
                <div className="absolute inset-4 border-2 border-dashed border-white/40 rounded-xl pointer-events-none flex flex-col justify-between p-2">
                  <div className="flex justify-between">
                    <span className="w-3 h-3 border-t-2 border-l-2 border-white"></span>
                    <span className="w-3 h-3 border-t-2 border-r-2 border-white"></span>
                  </div>
                  <div className="flex justify-between">
                    <span className="w-3 h-3 border-b-2 border-l-2 border-white"></span>
                    <span className="w-3 h-3 border-b-2 border-r-2 border-white"></span>
                  </div>
                </div>

                {isLoading && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-xs font-bold gap-2">
                    <span className="material-symbols-outlined animate-spin text-xl">progress_activity</span>
                    <span>Iniciando cámara...</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </DialogContent>

      {/* ── Pie de Modal / Botones de Acción ── */}
      <DialogActions
        sx={{
          p: 2,
          px: 2.5,
          bgcolor: 'var(--background, #fafafa)',
          borderTop: '1px solid var(--border-outline-variant, #f4f4f5)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        <Button
          onClick={() => {
            stopCameraStream();
            onClose();
          }}
          variant="secondary"
          size="sm"
          className="!h-9 !px-4 bg-zinc-900 dark:bg-zinc-800 text-white"
        >
          Cancelar
        </Button>

        {capturedItem ? (
          <div className="flex items-center gap-2">
            <Button
              onClick={handleRetake}
              variant="secondary"
              size="sm"
              icon="replay"
              className="!h-9 !px-4"
            >
              Cambiar / Reintentar
            </Button>
            <Button
              onClick={handleConfirm}
              variant="primary"
              size="sm"
              icon="check"
              className="!h-9 !px-6 shadow-md shadow-primary/20 font-black uppercase text-xs"
            >
              Usar Este Archivo
            </Button>
          </div>
        ) : (
          <Button
            onClick={handleCapturePhoto}
            disabled={Boolean(errorMsg) || isLoading}
            variant="primary"
            size="md"
            icon="photo_camera"
            className="!h-10 !px-8 shadow-lg shadow-primary/30 font-black uppercase text-xs"
          >
            Capturar Foto
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};
