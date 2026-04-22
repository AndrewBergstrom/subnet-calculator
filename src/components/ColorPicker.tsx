import { SUBNET_COLORS } from '../constants';

interface ColorPickerProps {
  value: string | null;
  onChange: (color: string | null) => void;
}

export default function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <div className="flex items-center gap-1">
      {SUBNET_COLORS.map((color) => (
        <button
          key={color}
          onClick={() => onChange(value === color ? null : color)}
          className="w-4 h-4 rounded-full transition-all duration-150 hover:scale-125 border-2"
          style={{
            backgroundColor: color,
            borderColor: value === color ? 'white' : 'transparent',
            boxShadow: value === color ? `0 0 0 2px ${color}` : 'none',
          }}
        />
      ))}
    </div>
  );
}
