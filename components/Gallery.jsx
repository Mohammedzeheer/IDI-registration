
import { useState, useEffect } from 'react';
import axios from 'axios';

const ImageCards = () => {
  const [cardData, setImages] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async (page = 1, limit = 6) => {
    try {
      const response = await axios.get('/api/gallery', {
        params: { page, limit }
      });
      const data = response.data;
      setImages(data.galleries || []);

    } catch (err) {
      console.error('Error fetching galleries:', err);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6 bg-white">
      <div className='flex justify-center mb-10'>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3">
        {cardData.map((card) => (
          <div
            key={`grid-${card.id}`}
            className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer"
          >
            <div className="aspect-[5/4] relative">
              <img
                src={card.imageUrl}
                alt={card.alt}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ImageCards;