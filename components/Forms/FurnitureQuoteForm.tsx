import React, { useState } from 'react';
import { Plus, Trash2, Upload, Send, Loader2 } from 'lucide-react';
import { FurnitureItem, FurnitureQuotePayload } from '../../types';
import { fileToBase64, submitFurnitureQuote } from '../../services/apiService';
import { useLanguage } from '../../context/LanguageContext';

export const FurnitureQuoteForm = () => {
  const { lang } = useLanguage();
  const [items, setItems] = useState<FurnitureItem[]>([
    { id: '1', name: '', quantity: 1, specs: '', imageBase64: null }
  ]);
  const [contact, setContact] = useState({ name: '', email: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const addItem = () => {
    const newItem: FurnitureItem = {
      id: Date.now().toString(),
      name: '',
      quantity: 1,
      specs: '',
      imageBase64: null
    };
    setItems([...items, newItem]);
  };

  const removeItem = (id: string) => {
    if (items.length === 1) return;
    setItems(items.filter(item => item.id !== id));
  };

  const handleItemChange = (id: string, field: keyof FurnitureItem, value: any) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleImageUpload = async (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const base64 = await fileToBase64(file);
        handleItemChange(id, 'imageBase64', base64);
      } catch (err) {
        console.error("Error converting file", err);
        alert("Error uploading image");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload: FurnitureQuotePayload = {
      lang,
      type: 'Furniture Request',
      client: {
        name: contact.name,
        email: contact.email,
        phone: '', // Placeholder
        source: 'Quick Quote Form'
      },
      project: {
        category: 'General',
        type: 'Quote',
        name: 'Online Request',
        woodType: 'Standard',
        level: 'Standard',
        style: 'Modern',
        notes: '',
        packages: ['Furniture'],
        details: JSON.stringify(items)
      },
      files: items.filter(i => i.imageBase64).map(i => ({
        name: i.name || 'image.png',
        base64: i.imageBase64?.split(',')[1] || ''
      }))
    };

    const success = await submitFurnitureQuote(payload);
    
    setIsSubmitting(false);
    if (success) {
      setSubmitted(true);
      // Reset after 3 seconds or keep as success message
    } else {
      alert("Failed to submit. Please try again.");
    }
  };

  if (submitted) {
    return (
      <div className="max-w-3xl mx-auto py-16 px-4 text-center">
        <div className="bg-green-50 p-8 rounded-lg border border-green-200">
          <h2 className="text-2xl font-bold text-green-800 mb-2">Quote Request Sent!</h2>
          <p className="text-green-600">Our team will review your furniture requirements and get back to you within 24 hours.</p>
          <button 
            onClick={() => { setSubmitted(false); setItems([{ id: '1', name: '', quantity: 1, specs: '', imageBase64: null }]); }}
            className="mt-6 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Submit Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-ukra-navy">Furniture & Supply Quote</h1>
        <p className="text-gray-500 mt-2">Bulk orders for Hotels, Offices, and Retail spaces.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Contact Info */}
        <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-ukra-gold">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Contact Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Full Name</label>
              <input
                required
                type="text"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-ukra-gold focus:ring-ukra-gold border p-2"
                value={contact.name}
                onChange={(e) => setContact({...contact, name: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email Address</label>
              <input
                required
                type="email"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-ukra-gold focus:ring-ukra-gold border p-2"
                value={contact.email}
                onChange={(e) => setContact({...contact, email: e.target.value})}
              />
            </div>
          </div>
        </div>

        {/* Dynamic Items */}
        <div className="space-y-4">
          <div className="flex justify-between items-end">
             <h2 className="text-xl font-semibold text-gray-800">Item Specifications</h2>
             <button
              type="button"
              onClick={addItem}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-full shadow-sm text-ukra-navy bg-ukra-gold hover:bg-yellow-500 focus:outline-none"
            >
              <Plus className="w-4 h-4 mr-1" /> Add Item
            </button>
          </div>

          {items.map((item, index) => (
            <div key={item.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 relative transition hover:shadow-md">
              <div className="absolute top-4 right-4">
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="text-red-400 hover:text-red-600 p-1"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                
                {/* Image Upload Area */}
                <div className="md:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Reference Image</label>
                  <div className="flex items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-md bg-gray-50 hover:bg-gray-100 overflow-hidden relative">
                     {item.imageBase64 ? (
                       <img src={item.imageBase64} alt="Preview" className="w-full h-full object-cover" />
                     ) : (
                        <div className="space-y-1 text-center">
                          <Upload className="mx-auto h-8 w-8 text-gray-400" />
                          <div className="flex text-xs text-gray-600">
                            <span className="relative cursor-pointer bg-white rounded-md font-medium text-ukra-gold hover:text-yellow-600 focus-within:outline-none">
                              <span>Upload</span>
                            </span>
                          </div>
                        </div>
                     )}
                     <input 
                        type="file" 
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(item.id, e)}
                     />
                  </div>
                </div>

                {/* Fields */}
                <div className="md:col-span-9 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Item Name</label>
                      <input
                        required
                        type="text"
                        placeholder="e.g., Lounge Chair"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-ukra-gold focus:ring-ukra-gold border p-2"
                        value={item.name}
                        onChange={(e) => handleItemChange(item.id, 'name', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Quantity</label>
                      <input
                        required
                        type="number"
                        min="1"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-ukra-gold focus:ring-ukra-gold border p-2"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(item.id, 'quantity', parseInt(e.target.value))}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Specifications / Dimensions</label>
                    <textarea
                      rows={2}
                      placeholder="Color, Fabric, Dimensions (WxHxD)..."
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-ukra-gold focus:ring-ukra-gold border p-2"
                      value={item.specs}
                      onChange={(e) => handleItemChange(item.id, 'specs', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-ukra-navy bg-ukra-gold hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ukra-gold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-5 h-5 mr-2" />
                Submit Quote Request
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};