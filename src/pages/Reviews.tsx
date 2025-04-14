import React from 'react';
import { Button } from '@/components/ui/button';
import AppHeader from '@/components/AppHeader';
import ReviewItem from '@/components/ReviewItem';
import { trackPageVisit } from '@/utils/trackPageVisit';
import { toast } from '@/lib/toast';
import { useAuth } from '@/contexts/AuthContext';

const Reviews = () => {
  const { user, incrementQueryUsage } = useAuth();

  React.useEffect(() => {
    trackPageVisit('/reviews');
  }, []);

  const handleSubmitReview = () => {
    // Use the new page-specific query limit check for 'reviews'
    if (!incrementQueryUsage('reviews')) {
      return;
    }

    // Existing review submission logic
    toast.success('Review submitted successfully');
  };

  return (
    <div className="flex flex-col h-screen">
      <AppHeader />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">App Reviews</h1>
        
        <div className="space-y-4">
          <ReviewItem 
            name="John Doe" 
            rating={4} 
            comment="Great app with awesome features!" 
          />
          <ReviewItem 
            name="Jane Smith" 
            rating={5} 
            comment="Incredibly useful tool for my work." 
          />
        </div>

        <div className="mt-8">
          <Button 
            onClick={handleSubmitReview}
            className="w-full"
          >
            Submit a Review
          </Button>
        </div>
      </main>
    </div>
  );
};

export default Reviews;
