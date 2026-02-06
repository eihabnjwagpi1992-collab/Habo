import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from '@/api/base44Client';
import { 
  Plus,
  Edit,
  Trash2,
  Search,
  Loader2,
  CheckCircle,
  XCircle,
  Image as ImageIcon,
  RotateCw,
  Upload
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import GlowCard from "@/components/ui/GlowCard";
import { toast } from "sonner";

export default function ManageServices() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [imageLoading, setImageLoading] = useState({});
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'gsm_server',
    subcategory: '',
    price: '',
    reseller_price: '',
    processing_time: '',
    is_active: true,
    is_featured: false,
    success_rate: '',
    instructions: '',
    image_url: ''
  });

  const { data: services = [], isLoading } = useQuery({
    queryKey: ['admin-services'],
    queryFn: () => base44.entities.Service.list('-created_date'),
    initialData: [],
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Service.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-services']);
      toast.success('Service created successfully');
      handleCloseDialog();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Service.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-services']);
      toast.success('Service updated successfully');
      handleCloseDialog();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Service.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-services']);
      toast.success('Service deleted successfully');
    }
  });

  const handleUploadImage = async (e, serviceId) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setImageLoading(prev => ({...prev, [serviceId]: true}));
      const response = await base44.integrations.Core.UploadFile({ file });
      await base44.entities.Service.update(serviceId, { image_url: response.file_url });
      queryClient.invalidateQueries(['admin-services']);
      toast.success('Image uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload image');
    } finally {
      setImageLoading(prev => ({...prev, [serviceId]: false}));
    }
  };

  const handleRegenerateImage = async (service) => {
    try {
      setImageLoading(prev => ({...prev, [service.id]: true}));
      await base44.functions.invoke('generateServiceImages', { 
        data: service,
        force_regenerate: true 
      });
      queryClient.invalidateQueries(['admin-services']);
      toast.success('Image regenerated successfully');
    } catch (error) {
      toast.error('Failed to regenerate image');
    } finally {
      setImageLoading(prev => ({...prev, [service.id]: false}));
    }
  };

  const handleOpenDialog = (service = null) => {
    if (service) {
      setEditingService(service);
      setFormData({
        name: service.name || '',
        description: service.description || '',
        category: service.category || 'gsm_server',
        subcategory: service.subcategory || '',
        price: service.price?.toString() || '',
        reseller_price: service.reseller_price?.toString() || '',
        big_seller_price: service.big_seller_price?.toString() || '',
        processing_time: service.processing_time || '',
        is_active: service.is_active ?? true,
        is_featured: service.is_featured ?? false,
        success_rate: service.success_rate || '',
        instructions: service.instructions || '',
        image_url: service.image_url || ''
      });
    } else {
      setEditingService(null);
      setFormData({
        name: '',
        description: '',
        category: 'gsm_server',
        subcategory: '',
        price: '',
        reseller_price: '',
        big_seller_price: '',
        processing_time: '',
        is_active: true,
        is_featured: false,
        success_rate: '',
        instructions: ''
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingService(null);
  };

  const handleSubmit = () => {
    const data = {
      ...formData,
      price: parseFloat(formData.price),
      reseller_price: formData.reseller_price ? parseFloat(formData.reseller_price) : null,
      big_seller_price: formData.big_seller_price ? parseFloat(formData.big_seller_price) : null,
      image_url: formData.image_url || null
    };

    if (editingService) {
      updateMutation.mutate({ id: editingService.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const filteredServices = services.filter(s =>
    s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.subcategory?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="py-4" style={{ color: 'var(--text-color)' }}>
      <div className="mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-color)' }}>Manage Services</h1>
            <p style={{ color: 'var(--text-muted)' }}>Create and manage service offerings</p>
          </div>
          <Button
            onClick={() => handleOpenDialog()}
            className="text-white"
            style={{ background: 'linear-gradient(to right, var(--gradient-from), var(--gradient-to))' }}
          >
            <Plus className="mr-2 w-4 h-4" />
            Add Service
          </Button>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--text-muted)' }} />
            <Input
              placeholder="Search services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 border"
              style={{ 
                backgroundColor: 'var(--input-bg)', 
                borderColor: 'var(--input-border)',
                color: 'var(--text-color)'
              }}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--primary)' }} />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((service) => (
             <GlowCard key={service.id} className="p-6 h-full flex flex-col">
                {service.image_url && (
                  <div className="mb-4 relative group overflow-hidden rounded-lg">
                    <img src={service.image_url} alt={service.name} className="w-full h-32 object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button 
                        onClick={() => document.getElementById(`upload-${service.id}`)?.click()}
                        className="p-2 bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors"
                        title="Replace image"
                      >
                        <Upload className="w-4 h-4 text-white" />
                      </button>
                      <button 
                        onClick={() => handleRegenerateImage(service)}
                        disabled={imageLoading[service.id]}
                        className="p-2 bg-purple-500 rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50"
                        title="Regenerate AI image"
                      >
                        <RotateCw className={`w-4 h-4 text-white ${imageLoading[service.id] ? 'animate-spin' : ''}`} />
                      </button>
                    </div>
                    <input 
                      id={`upload-${service.id}`}
                      type="file" 
                      accept="image/*" 
                      hidden 
                      onChange={(e) => handleUploadImage(e, service.id)}
                    />
                  </div>
                )}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex gap-2">
                    {service.is_featured && (
                      <Badge className="bg-amber-500/20 text-amber-400">Featured</Badge>
                    )}
                    <Badge variant={service.is_active ? "default" : "secondary"}>
                      {service.is_active ? (
                        <CheckCircle className="w-3 h-3 mr-1" />
                      ) : (
                        <XCircle className="w-3 h-3 mr-1" />
                      )}
                      {service.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>

                <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-color)' }}>{service.name}</h3>
                <p className="text-sm mb-2" style={{ color: 'var(--primary)' }}>{service.subcategory}</p>
                <p className="text-sm mb-4 line-clamp-2" style={{ color: 'var(--text-muted)' }}>{service.description}</p>

                <div className="flex items-center justify-between pt-4 border-t mb-4" style={{ borderColor: 'var(--border-color)' }}>
                  <div>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Regular Price</p>
                    <p className="text-xl font-bold" style={{ color: 'var(--text-color)' }}>${service.price?.toFixed(2)}</p>
                  </div>
                  {service.reseller_price && (
                    <div className="text-right">
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Reseller Price</p>
                      <p className="text-lg font-semibold" style={{ color: 'var(--success)' }}>${service.reseller_price?.toFixed(2)}</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 flex-wrap mt-auto">
                   {!service.image_url && (
                     <Button
                       onClick={() => document.getElementById(`upload-card-${service.id}`)?.click()}
                       variant="outline"
                       size="sm"
                       className="flex-1 border"
                       style={{ 
                         borderColor: 'var(--border-color)',
                         color: 'var(--text-color)'
                       }}
                     >
                       <Upload className="w-4 h-4 mr-2" />
                       Upload Image
                     </Button>
                   )}
                   <input 
                     id={`upload-card-${service.id}`}
                     type="file" 
                     accept="image/*" 
                     hidden 
                     onChange={(e) => handleUploadImage(e, service.id)}
                   />
                   <Button
                     onClick={() => handleOpenDialog(service)}
                     variant="outline"
                     size="sm"
                     className="flex-1 border"
                     style={{ 
                       borderColor: 'var(--border-color)',
                       color: 'var(--text-color)'
                     }}
                   >
                     <Edit className="w-4 h-4 mr-2" />
                     Edit
                   </Button>
                  <Button
                    onClick={() => {
                      if (confirm('Delete this service?')) {
                        deleteMutation.mutate(service.id);
                      }
                    }}
                    variant="outline"
                    size="sm"
                    className="border"
                    style={{
                      borderColor: 'var(--error)',
                      color: 'var(--error)'
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </GlowCard>
            ))}
          </div>
        )}

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent 
            className="border max-w-2xl max-h-[90vh] overflow-y-auto"
            style={{
              backgroundColor: 'var(--card-bg)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-color)'
            }}
          >
            <DialogHeader>
              <DialogTitle>{editingService ? 'Edit Service' : 'Add Service'}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label style={{ color: 'var(--text-color)' }}>Service Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="border"
                    style={{
                      backgroundColor: 'var(--input-bg)',
                      borderColor: 'var(--input-border)',
                      color: 'var(--text-color)'
                    }}
                  />
                </div>

                <div className="col-span-2">
                  <Label style={{ color: 'var(--text-color)' }}>Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="border h-24"
                    style={{
                      backgroundColor: 'var(--input-bg)',
                      borderColor: 'var(--input-border)',
                      color: 'var(--text-color)'
                    }}
                  />
                </div>

                <div>
                  <Label style={{ color: 'var(--text-color)' }}>Category</Label>
                  <Select value={formData.category} onValueChange={(v) => setFormData({...formData, category: v})}>
                    <SelectTrigger 
                      className="border"
                      style={{
                        backgroundColor: 'var(--input-bg)',
                        borderColor: 'var(--input-border)',
                        color: 'var(--text-color)'
                      }}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent 
                      style={{
                        backgroundColor: 'var(--card-bg)',
                        borderColor: 'var(--border-color)',
                        color: 'var(--text-color)'
                      }}
                    >
                      <SelectItem value="gsm_server">GSM Server</SelectItem>
                      <SelectItem value="game_topup">Game Top-Up</SelectItem>
                      <SelectItem value="digital_service">Digital Service</SelectItem>
                      <SelectItem value="software">Software</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label style={{ color: 'var(--text-color)' }}>Subcategory</Label>
                  <Input
                    value={formData.subcategory}
                    onChange={(e) => setFormData({...formData, subcategory: e.target.value})}
                    className="border"
                    style={{
                      backgroundColor: 'var(--input-bg)',
                      borderColor: 'var(--input-border)',
                      color: 'var(--text-color)'
                    }}
                  />
                </div>

                <div>
                  <Label style={{ color: 'var(--text-color)' }}>Regular Price ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    className="border"
                    style={{
                      backgroundColor: 'var(--input-bg)',
                      borderColor: 'var(--input-border)',
                      color: 'var(--text-color)'
                    }}
                  />
                </div>

                <div>
                  <Label style={{ color: 'var(--text-color)' }}>Reseller Price ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.reseller_price}
                    onChange={(e) => setFormData({...formData, reseller_price: e.target.value})}
                    className="border"
                    style={{
                      backgroundColor: 'var(--input-bg)',
                      borderColor: 'var(--input-border)',
                      color: 'var(--text-color)'
                    }}
                    placeholder="Optional"
                  />
                </div>

                <div>
                  <Label style={{ color: 'var(--text-color)' }}>Big Seller Price ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.big_seller_price || ''}
                    onChange={(e) => setFormData({...formData, big_seller_price: e.target.value})}
                    className="border"
                    style={{
                      backgroundColor: 'var(--input-bg)',
                      borderColor: 'var(--input-border)',
                      color: 'var(--text-color)'
                    }}
                    placeholder="Optional"
                  />
                </div>

                <div>
                  <Label style={{ color: 'var(--text-color)' }}>Processing Time</Label>
                  <Input
                    value={formData.processing_time}
                    onChange={(e) => setFormData({...formData, processing_time: e.target.value})}
                    className="border"
                    style={{
                      backgroundColor: 'var(--input-bg)',
                      borderColor: 'var(--input-border)',
                      color: 'var(--text-color)'
                    }}
                    placeholder="e.g., 1-24 hours"
                  />
                </div>

                <div>
                  <Label style={{ color: 'var(--text-color)' }}>Success Rate</Label>
                  <Input
                    value={formData.success_rate}
                    onChange={(e) => setFormData({...formData, success_rate: e.target.value})}
                    className="border"
                    style={{
                      backgroundColor: 'var(--input-bg)',
                      borderColor: 'var(--input-border)',
                      color: 'var(--text-color)'
                    }}
                    placeholder="e.g., 95%"
                  />
                </div>

                <div className="col-span-2">
                  <Label style={{ color: 'var(--text-color)' }}>Instructions</Label>
                  <Textarea
                    value={formData.instructions}
                    onChange={(e) => setFormData({...formData, instructions: e.target.value})}
                    className="border h-24"
                    style={{
                      backgroundColor: 'var(--input-bg)',
                      borderColor: 'var(--input-border)',
                      color: 'var(--text-color)'
                    }}
                    placeholder="Step-by-step instructions for users"
                  />
                </div>

                <div className="col-span-2">
                  <Label style={{ color: 'var(--text-color)' }}>Service Image</Label>
                  <div className="flex gap-3 mt-2">
                    <input 
                      type="file" 
                      accept="image/*" 
                      id="image-upload"
                      hidden
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            const response = await base44.integrations.Core.UploadFile({ file });
                            setFormData({...formData, image_url: response.file_url});
                          } catch (error) {
                            toast.error('Failed to upload image');
                          }
                        }
                      }}
                    />
                    <Button
                      type="button"
                      onClick={() => document.getElementById('image-upload')?.click()}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Custom Image
                    </Button>
                  </div>
                  {formData.image_url && (
                    <div className="mt-3 flex gap-3 items-start p-3 bg-white/5 rounded-lg border border-white/10">
                      <img src={formData.image_url} alt="Preview" className="w-20 h-20 object-cover rounded" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-400 mb-2">Image Preview</p>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => setFormData({...formData, image_url: ''})}
                          className="bg-red-600 hover:bg-red-700 text-white font-semibold w-full"
                        >
                          Remove Image
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="col-span-2 space-y-3 p-4 bg-blue-500/10 rounded-lg border border-blue-500/30">
                  <div className="flex items-center justify-between">
                    <Label style={{ color: 'var(--text-color)' }} className="font-semibold">Active Service</Label>
                    <Switch
                      checked={formData.is_active}
                      onCheckedChange={(v) => setFormData({...formData, is_active: v})}
                    />
                  </div>
                  <p className="text-xs text-gray-400">Service will be visible to users when active</p>
                </div>

                <div className="col-span-2 space-y-3 p-4 bg-amber-500/10 rounded-lg border border-amber-500/30">
                  <div className="flex items-center justify-between">
                    <Label style={{ color: 'var(--text-color)' }} className="font-semibold">Featured Service</Label>
                    <Switch
                      checked={formData.is_featured}
                      onCheckedChange={(v) => setFormData({...formData, is_featured: v})}
                    />
                  </div>
                  <p className="text-xs text-gray-400">Featured services appear at the top</p>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={handleCloseDialog} 
                className="border"
                style={{
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-color)'
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!formData.name || !formData.price}
                className="text-white"
                style={{ background: 'linear-gradient(to right, var(--gradient-from), var(--gradient-to))' }}
              >
                {editingService ? 'Update' : 'Create'} Service
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}