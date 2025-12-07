import React from 'react';
import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider';

interface BeforeAfterSliderProps {
  beforeImage: string;
  afterImage: string;
  beforeLabel?: string;
  afterLabel?: string;
}

export const BeforeAfterSlider: React.FC<BeforeAfterSliderProps> = ({
  beforeImage,
  afterImage,
  beforeLabel = 'Before',
  afterLabel = 'After',
}) => {
  return (
    <div className="relative w-full h-full">
      <ReactCompareSlider
        itemOne={
          <div className="relative w-full h-full">
            <ReactCompareSliderImage
              src={beforeImage}
              alt={beforeLabel}
              style={{ objectFit: 'contain', width: '100%', height: '100%' }}
            />
            {/* Before Label */}
            <div className="absolute top-4 left-4 bg-slate-700 text-white px-3 py-1.5 rounded-lg text-sm font-semibold shadow-lg z-10">
              {beforeLabel}
            </div>
          </div>
        }
        itemTwo={
          <div className="relative w-full h-full">
            <ReactCompareSliderImage
              src={afterImage}
              alt={afterLabel}
              style={{ objectFit: 'contain', width: '100%', height: '100%' }}
            />
            {/* After Label */}
            <div className="absolute top-4 right-4 bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-sm font-semibold shadow-lg z-10">
              {afterLabel}
            </div>
          </div>
        }
        position={50}
        style={{
          width: '100%',
          height: '100%',
        }}
      />
    </div>
  );
};
