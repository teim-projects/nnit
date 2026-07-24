import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Switch,
  FormControlLabel,
  Tooltip,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Check as CheckIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api/quotation';

const TermsConditions = () => {
  const [terms, setTerms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingTerm, setEditingTerm] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  const [formData, setFormData] = useState({
    title: '',
    sequence: 1,
    content: '',
    is_active: true,
    is_default: false,
  });

  useEffect(() => {
    fetchTerms();
  }, []);

  const fetchTerms = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/terms/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTerms(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching terms:', error);
      showSnackbar('Error loading terms', 'error');
      setLoading(false);
    }
  };

  const handleOpenDialog = (term = null) => {
    if (term) {
      setEditingTerm(term);
      setFormData({
        title: term.title,
        sequence: term.sequence,
        content: term.content,
        is_active: term.is_active,
        is_default: term.is_default,
      });
    } else {
      setEditingTerm(null);
      const maxSequence = terms.length > 0 ? Math.max(...terms.map(t => t.sequence)) : 0;
      setFormData({
        title: '',
        sequence: maxSequence + 1,
        content: '',
        is_active: true,
        is_default: false,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingTerm(null);
    setFormData({
      title: '',
      sequence: 1,
      content: '',
      is_active: true,
      is_default: false,
    });
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      if (editingTerm) {
        await axios.patch(`${API_BASE_URL}/terms/${editingTerm.id}/`, formData, config);
        showSnackbar('Term updated successfully', 'success');
      } else {
        await axios.post(`${API_BASE_URL}/terms/`, formData, config);
        showSnackbar('Term created successfully', 'success');
      }

      fetchTerms();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving term:', error);
      showSnackbar('Error saving term', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this term?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE_URL}/terms/${id}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showSnackbar('Term deleted successfully', 'success');
      fetchTerms();
    } catch (error) {
      console.error('Error deleting term:', error);
      showSnackbar('Error deleting term', 'error');
    }
  };

  const handleToggleActive = async (term) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `${API_BASE_URL}/terms/${term.id}/`,
        { is_active: !term.is_active },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchTerms();
      showSnackbar('Term status updated', 'success');
    } catch (error) {
      console.error('Error updating term:', error);
      showSnackbar('Error updating term', 'error');
    }
  };

  const handleToggleDefault = async (term) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `${API_BASE_URL}/terms/${term.id}/`,
        { is_default: !term.is_default },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchTerms();
      showSnackbar('Default status updated', 'success');
    } catch (error) {
      console.error('Error updating term:', error);
      showSnackbar('Error updating term', 'error');
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Terms & Conditions Master
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add New Term
        </Button>
      </Box>

      {/* Summary Cards */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography color="text.secondary" gutterBottom>
              Total Terms
            </Typography>
            <Typography variant="h4">{terms.length}</Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography color="text.secondary" gutterBottom>
              Active Terms
            </Typography>
            <Typography variant="h4">
              {terms.filter(t => t.is_active).length}
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography color="text.secondary" gutterBottom>
              Default Terms
            </Typography>
            <Typography variant="h4">
              {terms.filter(t => t.is_default).length}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Terms Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell width="80">Seq</TableCell>
              <TableCell>Title</TableCell>
              <TableCell width="150">Status</TableCell>
              <TableCell width="150">Default</TableCell>
              <TableCell width="200">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {terms.map((term) => (
              <TableRow key={term.id} hover>
                <TableCell>{term.sequence}</TableCell>
                <TableCell>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {term.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {term.content.substring(0, 100)}...
                  </Typography>
                </TableCell>
                <TableCell>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={term.is_active}
                        onChange={() => handleToggleActive(term)}
                        size="small"
                      />
                    }
                    label={term.is_active ? 'Active' : 'Inactive'}
                  />
                </TableCell>
                <TableCell>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={term.is_default}
                        onChange={() => handleToggleDefault(term)}
                        size="small"
                        color="secondary"
                      />
                    }
                    label={term.is_default ? 'Yes' : 'No'}
                  />
                </TableCell>
                <TableCell>
                  <Tooltip title="Edit">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleOpenDialog(term)}
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(term.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
            {terms.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <Typography color="text.secondary" sx={{ py: 3 }}>
                    No terms found. Click "Add New Term" to create one.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingTerm ? 'Edit Term' : 'Add New Term'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Sequence"
              type="number"
              value={formData.sequence}
              onChange={(e) => setFormData({ ...formData, sequence: parseInt(e.target.value) })}
              fullWidth
              required
            />
            <TextField
              label="Title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              fullWidth
              required
              placeholder="e.g., Scope of Work"
            />
            <TextField
              label="Content"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              fullWidth
              required
              multiline
              rows={10}
              placeholder="Enter the full text of the term/condition..."
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  />
                }
                label="Active"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_default}
                    onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                    color="secondary"
                  />
                }
                label="Include by Default in New Quotations"
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={!formData.title || !formData.content}
          >
            {editingTerm ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default TermsConditions;
