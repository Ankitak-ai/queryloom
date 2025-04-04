
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import AppHeader from '@/components/AppHeader';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star, StarHalf, StarOff, MessageSquare } from 'lucide-react';
import { toast } from '@/lib/toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ReviewItem from '@/components/ReviewItem';

interface Review {
  id: string;
  user_email: string;
  content: string;
  rating: number;
  created_at: string;
}

const Reviews = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [content, setContent] = useState('');
  const [rating, setRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  
  useEffect(() => {
    fetchReviews();
  }, []);
  
  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      setReviews(data || []);
    } catch (error: any) {
      console.error('Error fetching reviews:', error.message);
    }
  };
  
  const handleRatingClick = (value: number) => {
    setRating(value);
  };
  
  const handleSubmitReview = async () => {
    if (!user) {
      toast.error('Please sign in to leave a review');
      return;
    }
    
    if (content.trim() === '') {
      toast.error('Please enter a review');
      return;
    }
    
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('reviews')
        .insert([
          {
            user_id: user.id,
            user_email: user.email,
            content,
            rating
          }
        ]);
        
      if (error) throw error;
      
      toast.success('Review submitted successfully');
      setContent('');
      setRating(0);
      fetchReviews();
    } catch (error: any) {
      console.error('Error submitting review:', error.message);
      toast.error('Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const renderStars = (value: number) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => handleRatingClick(star)}
            className="focus:outline-none"
          >
            {rating >= star ? (
              <Star className="w-6 h-6 text-yellow-500" />
            ) : (
              <StarOff className="w-6 h-6 text-gray-300" />
            )}
          </button>
        ))}
      </div>
    );
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-purple-50 dark:from-gray-900 dark:to-purple-950">
      <AppHeader />
      
      <div className="container px-4 mx-auto max-w-6xl py-8">
        <h1 className="text-3xl font-bold mb-8 text-center">Reviews</h1>
        
        <Tabs defaultValue="all-reviews" className="mb-8">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="all-reviews">All Reviews</TabsTrigger>
            <TabsTrigger value="leave-review">Leave a Review</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all-reviews">
            <Card>
              <CardHeader>
                <CardTitle>Community Reviews</CardTitle>
                <CardDescription>
                  See what others are saying about our SQL Query Builder
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reviews.length > 0 ? (
                    reviews.map((review) => (
                      <ReviewItem key={review.id} review={review} />
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No reviews yet. Be the first to leave a review!</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="leave-review">
            <Card>
              <CardHeader>
                <CardTitle>Leave a Review</CardTitle>
                <CardDescription>
                  Share your experience with our SQL Query Builder
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm font-medium mb-2">Rating</div>
                  {renderStars(rating)}
                </div>
                <div>
                  <div className="text-sm font-medium mb-2">Your Review</div>
                  <Textarea
                    placeholder="Write your review here..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="min-h-[120px]"
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={handleSubmitReview} 
                  disabled={isSubmitting}
                  className="w-full"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Review'}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Reviews;
