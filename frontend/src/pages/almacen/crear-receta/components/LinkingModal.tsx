import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Autocomplete,
  TextField
} from '@mui/material';
import { Button } from '../../../../components/common/Button';

interface LinkingModalProps {
  open: boolean;
  onClose: () => void;
  selectedWarehouse: any;
  productsCategoria2: any[];
  selectedGlobalProduct: any;
  setSelectedGlobalProduct: (product: any) => void;
  handleLinkProduct: () => void;
  selectSx: any;
}

export const LinkingModal: React.FC<LinkingModalProps> = ({
  open,
  onClose,
  selectedWarehouse,
  productsCategoria2,
  selectedGlobalProduct,
  setSelectedGlobalProduct,
  handleLinkProduct,
  selectSx
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            borderRadius: '2rem',
            p: 2,
            bgcolor: 'var(--background)',
            color: 'var(--on-background)',
            backgroundImage: 'none' // Ensures background-color is solid under dark mode
          }
        }
      }}
    >
      <DialogTitle className="font-black text-on-background uppercase tracking-tight text-lg">
        Vincular Producto
      </DialogTitle>
      <DialogContent className="space-y-4 pt-2">
        <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider leading-relaxed">
          Seleccione un producto del catálogo maestro para habilitarlo en el almacén{' '}
          <span className="text-primary font-black">"{selectedWarehouse?.DESCRICION || ''}"</span>.
        </p>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <label className="block text-[9px] font-black text-on-surface-variant uppercase tracking-widest ml-1">
              Producto Maestro
            </label>
            <Autocomplete
              options={productsCategoria2}
              getOptionLabel={(o: any) => o.PRODUCTO || ''}
              value={selectedGlobalProduct}
              onChange={(_, v) => setSelectedGlobalProduct(v)}
              isOptionEqualToValue={(option, value) => option.ID_SUB_CATEGORIA_2 === value?.ID_SUB_CATEGORIA_2}
              sx={selectSx}
              renderInput={(params) => (
                <TextField {...params} variant="outlined" size="small" placeholder="Buscar producto global..." />
              )}
            />
          </div>
        </div>
      </DialogContent>
      <DialogActions className="p-6 pt-0 gap-2">
        <Button variant="ghost" size="sm" onClick={onClose} className="!text-on-surface-variant">
          Cancelar
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={handleLinkProduct}
          disabled={!selectedGlobalProduct}
          className="!px-6"
        >
          Vincular y Continuar
        </Button>
      </DialogActions>
    </Dialog>
  );
};
