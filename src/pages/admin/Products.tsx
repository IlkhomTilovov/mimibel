import { useState } from 'react';
import { Eye, Package } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { products, categories } from '@/lib/data';
import { useLanguage } from '@/hooks/useLanguage';

export default function Products() {
  const { language } = useLanguage();
  
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('uz-UZ').format(price) + ' so\'m';
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? (language === 'uz' ? category.name_uz : category.name_ru) : categoryId;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Mahsulotlar</h1>
          <p className="text-muted-foreground">Katalogdagi barcha mahsulotlar</p>
        </div>
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-muted-foreground" />
          <span className="font-medium">{products.length} ta mahsulot</span>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rasm</TableHead>
                  <TableHead>Nomi</TableHead>
                  <TableHead>Kategoriya</TableHead>
                  <TableHead>Narxi</TableHead>
                  <TableHead>Holat</TableHead>
                  <TableHead className="text-right">Ko'rish</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <img 
                        src={product.images[0]} 
                        alt={product.name_uz}
                        className="w-12 h-12 object-cover rounded-lg"
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      {language === 'uz' ? product.name_uz : product.name_ru}
                    </TableCell>
                    <TableCell>{getCategoryName(product.categoryId)}</TableCell>
                    <TableCell>{formatPrice(product.price)}</TableCell>
                    <TableCell>
                      <Badge variant={product.inStock ? 'outline' : 'secondary'}>
                        {product.inStock ? 'Mavjud' : 'Buyurtmaga'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" asChild>
                        <Link to={`/product/${product.id}`} target="_blank">
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="font-medium mb-2">Mahsulotlarni tahrirlash</h3>
            <p className="text-sm">
              Mahsulotlarni qo'shish, tahrirlash va o'chirish uchun backend database bilan to'liq integratsiya kerak.
              Hozircha mahsulotlar data.ts faylida saqlanmoqda.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
