import React from 'react';
import { Box, Typography } from '@mui/material';
import tazaLoading from '../img/taza_loading.png';

interface LoadingOverlayProps {
  show: boolean;
  message?: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ show, message = '...' }) => {
  if (!show) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        bgcolor: 'rgba(78, 77, 77, 0.8)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        animation: 'fadeIn 0.3s ease-out',
        '@keyframes fadeIn': {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
      }}
    >
      <Box
        sx={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 3,
        }}
      >
        <Box
          component="img"
          src={tazaLoading}
          alt="Loading..."
          sx={{
            width: 120,
            height: 'auto',
            animation: 'pulse 1.5s ease-in-out infinite',
            filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.1))',
            '@keyframes pulse': {
              '0%, 100%': { transform: 'scale(1)', opacity: 1 },
              '50%': { transform: 'scale(1.1)', opacity: 0.8 },
            },
          }}
        />

        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
          <Typography
            sx={{
              fontSize: '12px',
              fontWeight: '900',
              textTransform: 'uppercase',
              tracking: '0.3em',
              color: 'var(--primary)',
              letterSpacing: '4px',
              animation: 'textPulse 1.5s ease-in-out infinite',
              '@keyframes textPulse': {
                '0%, 100%': { opacity: 1 },
                '50%': { opacity: 0.5 },
              },
            }}
          >
            {message}
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            {[0, 1, 2].map((i) => (
              <Box
                key={i}
                sx={{
                  width: 4,
                  height: 4,
                  borderRadius: '50%',
                  bgcolor: 'var(--primary)',
                  animation: `bounce 1s infinite ${i * 0.2}s`,
                  '@keyframes bounce': {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-5px)' },
                  },
                }}
              />
            ))}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default LoadingOverlay;
