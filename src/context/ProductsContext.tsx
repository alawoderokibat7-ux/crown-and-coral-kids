import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Product } from '../types';
import { DEMO_PRODUCTS } from '../data/products';
import { supabase } from '../lib/supabaseClient';

export interface ProductVariant {
  id: string;
  product_id: string;
  size: string;
  sku: string;
  stock_count: number;
}

interface ProductsContextType {
  products: Product[];
  variants: Record<string, ProductVariant[]>;
  isLoading: boolean;
  refreshProducts: () => Promise<void>;
  updateVariantStock: (variantId: string, delta: number, reason: string, orderId?: string) => Promise<boolean>;
  setVariantStockDirect: (variantId: string, newStock: number, reason: string) => Promise<boolean>;
  createProduct: (productData: Partial<Product> & { initialSizes?: { size: string; stock: number }[] }) => Promise<{ success: boolean; error?: string; id?: string }>;
  updateProduct: (productId: string, updates: Partial<Product>) => Promise<{ success: boolean; error?: string }>;
  deleteProduct: (productId: string) => Promise<{ success: boolean; error?: string }>;
  getProductStock: (productId: string, size?: string) => number;
}

const ProductsContext = createContext<ProductsContextType | undefined>(undefined);

export const ProductsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>(DEMO_PRODUCTS);
  const [variants, setVariants] = useState<Record<string, ProductVariant[]>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Fetch products and variants from Supabase
  const fetchProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      // 1. Fetch products
      const { data: dbProducts, error: prodErr } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (prodErr || !dbProducts || dbProducts.length === 0) {
        console.warn('Using local catalogue fallback:', prodErr?.message);
        setProducts(DEMO_PRODUCTS);
        setIsLoading(false);
        return;
      }

      // 2. Fetch variants
      const { data: dbVariants } = await supabase
        .from('product_variants')
        .select('*');

      // 3. Fetch images
      const { data: dbImages } = await supabase
        .from('product_images')
        .select('*')
        .order('display_order', { ascending: true });

      // Build variants map
      const variantMap: Record<string, ProductVariant[]> = {};
      (dbVariants || []).forEach((v: any) => {
        if (!variantMap[v.product_id]) {
          variantMap[v.product_id] = [];
        }
        variantMap[v.product_id].push({
          id: v.id,
          product_id: v.product_id,
          size: v.size,
          sku: v.sku,
          stock_count: v.stock_count,
        });
      });
      setVariants(variantMap);

      // Build images map
      const imageMap: Record<string, string[]> = {};
      (dbImages || []).forEach((img: any) => {
        if (!imageMap[img.product_id]) {
          imageMap[img.product_id] = [];
        }
        imageMap[img.product_id].push(img.url || img.image_url);
      });

      // Map Supabase rows to Product interface
      const mappedProducts: Product[] = dbProducts.map((p: any) => {
        const prodVariants = variantMap[p.id] || [];
        const sizes = prodVariants.map((v) => v.size);
        const totalStock = prodVariants.reduce((sum, v) => sum + v.stock_count, 0);
        const images = imageMap[p.id] && imageMap[p.id].length > 0
          ? imageMap[p.id]
          : [
              'https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?q=80&w=800&auto=format&fit=crop',
              'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?q=80&w=800&auto=format&fit=crop'
            ];

        // Match category labels
        const categoryLabels: Record<string, string> = {
          'dresses-partywear': 'Royal Occasion & Partywear',
          'birthday': 'Sunday Best & Milestone Galas',
          'matching-sets': 'Heirloom Linen & Sets',
          'baby': 'Royal Toddlers (1–3 yrs)',
          'shoes-accessories': 'Crown & Coral Keepsakes',
          'girls': "Girls' Collection",
          'boys': "Boys' Collection",
        };

        return {
          id: p.id,
          name: p.name,
          tagline: p.tagline || '',
          category: p.category_id,
          categoryLabel: categoryLabels[p.category_id] || p.category_id,
          gender: p.gender as 'girls' | 'boys' | 'unisex',
          ageRange: p.age_range || `${p.age_min}-${p.age_max} Years`,
          ageMin: p.age_min,
          ageMax: p.age_max,
          price: Number(p.price),
          originalPrice: p.original_price ? Number(p.original_price) : undefined,
          images,
          availableSizes: sizes.length > 0 ? sizes : ['4Y', '5Y', '6Y'],
          inStock: p.in_stock && totalStock > 0,
          stockCount: totalStock,
          isFeatured: Boolean(p.is_featured),
          isNewArrival: Boolean(p.is_new_arrival),
          isBestSeller: Boolean(p.is_best_seller),
          rating: 4.9,
          reviewsCount: 24,
          description: p.description || '',
          fabricDetails: p.fabric_details || 'Bespoke Royal Fabric',
          careInstructions: Array.isArray(p.care_instructions) ? p.care_instructions : ['Dry clean or gentle hand wash'],
          tags: Array.isArray(p.tags) ? p.tags : ['royal', 'atelier'],
        };
      });

      // Merge with any demo products not yet in database
      const existingIds = new Set(mappedProducts.map((p) => p.id));
      const remainingDemo = DEMO_PRODUCTS.filter((dp) => !existingIds.has(dp.id));
      setProducts([...mappedProducts, ...remainingDemo]);
    } catch (err) {
      console.error('Error fetching products:', err);
      setProducts(DEMO_PRODUCTS);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Adjust variant stock by delta (positive for restock, negative for sale/reservation)
  const updateVariantStock = async (
    variantId: string, 
    delta: number, 
    reason: string, 
    orderId?: string
  ): Promise<boolean> => {
    try {
      const { data, error } = await supabase.rpc('record_stock_movement' as any, {
        p_variant_id: variantId,
        p_quantity_change: delta,
        p_reason: reason,
        p_order_id: orderId || null,
      });

      if (error) {
        console.error('Stock adjustment RPC failed:', error);
        return false;
      }

      await fetchProducts();
      return true;
    } catch (e) {
      console.error('Failed to update variant stock:', e);
      return false;
    }
  };

  // Direct set variant stock
  const setVariantStockDirect = async (
    variantId: string, 
    newStock: number, 
    reason: string
  ): Promise<boolean> => {
    try {
      // Find current stock
      let currentStock = 0;
      for (const list of Object.values(variants)) {
        const found = list.find((v) => v.id === variantId);
        if (found) {
          currentStock = found.stock_count;
          break;
        }
      }
      const delta = newStock - currentStock;
      return await updateVariantStock(variantId, delta, reason);
    } catch (e) {
      console.error('Failed to set variant stock directly:', e);
      return false;
    }
  };

  // Create new product
  const createProduct = async (
    productData: Partial<Product> & { initialSizes?: { size: string; stock: number }[] }
  ): Promise<{ success: boolean; error?: string; id?: string }> => {
    try {
      const newId = `cc-${Date.now().toString().slice(-4)}`;
      const { error: insertErr } = await supabase.from('products').insert({
        id: newId,
        name: productData.name || 'Crown Atelier Creation',
        tagline: productData.tagline || 'Bespoke Royal Childrenwear',
        category_id: productData.category || 'dresses-partywear',
        gender: productData.gender || 'girls',
        age_range: productData.ageRange || '4-6 Years',
        age_min: productData.ageMin || 4,
        age_max: productData.ageMax || 6,
        price: productData.price || 25000,
        original_price: productData.originalPrice || null,
        is_featured: productData.isFeatured || false,
        is_new_arrival: true,
        is_best_seller: false,
        in_stock: true,
        description: productData.description || 'Heirloom quality handcrafted piece.',
        fabric_details: productData.fabricDetails || '100% Breathable Organic Cotton',
        care_instructions: productData.careInstructions || ['Gentle wash cold', 'Steam gently'],
        tags: productData.tags || ['atelier', 'royal'],
      });

      if (insertErr) {
        return { success: false, error: insertErr.message };
      }

      // Add image if provided
      if (productData.images && productData.images.length > 0) {
        const imageRows = productData.images.map((url, index) => ({
          product_id: newId,
          url: url,
          is_primary: index === 0,
          display_order: index,
        }));
        await supabase.from('product_images').insert(imageRows);
      }

      // Add variant sizes
      const sizesToCreate = productData.initialSizes || [
        { size: '4Y', stock: 5 },
        { size: '5Y', stock: 5 },
        { size: '6Y', stock: 5 },
      ];

      const variantRows = sizesToCreate.map((s) => ({
        product_id: newId,
        size: s.size,
        sku: `SKU-${newId.toUpperCase()}-${s.size}`,
        stock_count: s.stock,
      }));

      await supabase.from('product_variants').insert(variantRows);
      await fetchProducts();

      return { success: true, id: newId };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to create product' };
    }
  };

  // Update existing product
  const updateProduct = async (
    productId: string, 
    updates: Partial<Product>
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const dbUpdates: any = { updated_at: new Date().toISOString() };
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.tagline !== undefined) dbUpdates.tagline = updates.tagline;
      if (updates.category !== undefined) dbUpdates.category_id = updates.category;
      if (updates.gender !== undefined) dbUpdates.gender = updates.gender;
      if (updates.price !== undefined) dbUpdates.price = updates.price;
      if (updates.originalPrice !== undefined) dbUpdates.original_price = updates.originalPrice;
      if (updates.isFeatured !== undefined) dbUpdates.is_featured = updates.isFeatured;
      if (updates.isNewArrival !== undefined) dbUpdates.is_new_arrival = updates.isNewArrival;
      if (updates.isBestSeller !== undefined) dbUpdates.is_best_seller = updates.isBestSeller;
      if (updates.inStock !== undefined) dbUpdates.in_stock = updates.inStock;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.fabricDetails !== undefined) dbUpdates.fabric_details = updates.fabricDetails;

      const { error } = await supabase
        .from('products')
        .update(dbUpdates)
        .eq('id', productId);

      if (error) {
        return { success: false, error: error.message };
      }

      await fetchProducts();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to update product' };
    }
  };

  // Delete product
  const deleteProduct = async (productId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase.from('products').delete().eq('id', productId);
      if (error) {
        return { success: false, error: error.message };
      }
      await fetchProducts();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to delete product' };
    }
  };

  // Get stock for product or specific size
  const getProductStock = (productId: string, size?: string): number => {
    const list = variants[productId];
    if (!list || list.length === 0) {
      const found = products.find((p) => p.id === productId);
      return found?.stockCount || 0;
    }
    if (size) {
      const variant = list.find((v) => v.size.toLowerCase() === size.toLowerCase());
      return variant ? variant.stock_count : 0;
    }
    return list.reduce((sum, v) => sum + v.stock_count, 0);
  };

  return (
    <ProductsContext.Provider
      value={{
        products,
        variants,
        isLoading,
        refreshProducts: fetchProducts,
        updateVariantStock,
        setVariantStockDirect,
        createProduct,
        updateProduct,
        deleteProduct,
        getProductStock,
      }}
    >
      {children}
    </ProductsContext.Provider>
  );
};

export const useProducts = () => {
  const context = useContext(ProductsContext);
  if (!context) {
    throw new Error('useProducts must be used within a ProductsProvider');
  }
  return context;
};
