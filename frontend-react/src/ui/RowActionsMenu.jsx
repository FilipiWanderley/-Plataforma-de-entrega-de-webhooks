import React, { useState } from 'react';
import { IconButton, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import { MoreVert } from '@mui/icons-material';

export default function RowActionsMenu({ actions = [] }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    event.stopPropagation(); // Prevent row click
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <IconButton aria-label="Actions" onClick={handleClick} size="small">
        <MoreVert fontSize="small" />
      </IconButton>
      <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
        {actions.map((action, index) => {
          if (!action) return null;
          return (
            <MenuItem
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                handleClose();
                action.onClick();
              }}
              disabled={action.disabled}
              sx={{ minWidth: 120 }}
            >
              {action.icon && <ListItemIcon sx={{ minWidth: 32 }}>{action.icon}</ListItemIcon>}
              <ListItemText>{action.label}</ListItemText>
            </MenuItem>
          );
        })}
      </Menu>
    </>
  );
}
