
import React from 'react';
import { Card } from '@/components/ui/card';
import { Star, StarHalf, StarOff } from 'lucide-react';

interface Review {
  id: string;
  user_email: string;
  content: string;
  rating: number;
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
  
  const renderRatingStars = (rating: number) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <span key={star}>
            {rating >= star ? (
              <Star className="w-4 h-4 text-yellow-500" />
            ) : (
              <StarOff className="w-4 h-4 text-gray-300" />
            )}
          </span>
        ))}
      </div>
    );
  };
  
  return (
    <Card className="p-4">
      <div className="flex justify-between items-start mb-2">
        <div>
          <div className="font-medium">{review.user_email}</div>
          <div className="text-xs text-gray-500">{formatDate(review.created_at)}</div>
        </div>
        {renderRatingStars(review.rating)}
      </div>
      <p className="text-sm mt-2">{review.content}</p>
    </Card>
  );
};

export default ReviewItem;
