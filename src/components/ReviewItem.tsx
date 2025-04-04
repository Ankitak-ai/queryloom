
import React from 'react';
import { Card } from '@/components/ui/card';

interface Review {
  id: string;
  name: string;
  content: string;
  created_at: string;
}

interface ReviewItemProps {
  review: Review;
}

const ReviewItem: React.FC<ReviewItemProps> = ({ review }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  return (
    <Card className="p-4">
      <div className="flex justify-between items-start mb-2">
        <div>
          <div className="font-medium">{review.name}</div>
          <div className="text-xs text-gray-500">{formatDate(review.created_at)}</div>
        </div>
      </div>
      <p className="text-sm mt-2">{review.content}</p>
    </Card>
  );
};

export default ReviewItem;
