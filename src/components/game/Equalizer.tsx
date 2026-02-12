'use client';

export default function Equalizer() {
  return (
    <div className="flex items-end gap-1 h-16 justify-center">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="equalizer-bar w-3 bg-primary rounded-t origin-bottom"
          style={{ height: '100%' }}
        />
      ))}
    </div>
  );
}
