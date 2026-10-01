import React from 'react';
import ProductCard from './ProductCard.jsx';
import EmptyState from '../common/EmptyState.jsx';
import { StaggerContainer, StaggerItem } from '../common/ScrollReveal.jsx';
import { FiShoppingBag } from 'react-icons/fi';

export default function ProductGrid({
  products = [],
  onAddToCart,
  emptyTitle = 'No products found',
  emptyDescription = 'Try adjusting your search criteria or selecting a different category.',
  columns = 4,
}) {
  if (!products || products.length === 0) {
    return (
      <EmptyState
        icon={FiShoppingBag}
        title={emptyTitle}
        description={emptyDescription}
      />
    );
  }

  const columnClasses = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
  };

  return (
    <StaggerContainer
      staggerDelay={0.07}
      className={`grid gap-5 sm:gap-6 ${
        columnClasses[columns] || columnClasses[4]
      }`}
    >
      {products.map((product) => (
        <StaggerItem key={product.id}>
          <ProductCard
            product={product}
            onAddToCart={onAddToCart}
          />
        </StaggerItem>
      ))}
    </StaggerContainer>
  );
}
