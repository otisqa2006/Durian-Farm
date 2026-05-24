import React, { useState, useEffect } from 'react';

interface NumericInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string | number;
  onChange: (value: string) => void;
  // Ký tự phân cách hàng nghìn, mặc định là '.'
  separator?: string;
  allowDecimal?: boolean;
}

export default function NumericInput({ 
  value, 
  onChange, 
  separator = '.', 
  allowDecimal = false,
  className,
  ...props 
}: NumericInputProps) {
  const [displayValue, setDisplayValue] = useState('');

  // Format số: "1000000" -> "1.000.000"
  const formatNumber = (val: string | number) => {
    if (val === null || val === undefined || val === '') return '';
    
    // Loại bỏ tất cả ký tự không hợp lệ
    let stringValue = val.toString();
    if (allowDecimal) {
      stringValue = stringValue.replace(/[^\d.,-]/g, '').replace(',', '.'); // Cho phép dấu chấm hoặc phẩy thành chấm
      // Giữ lại dấu chấm thập phân đầu tiên, xoá các dấu chấm phía sau
      const parts = stringValue.split('.');
      if (parts.length > 1) {
        stringValue = parts[0] + '.' + parts.slice(1).join('');
      }
    } else {
      stringValue = stringValue.replace(/[^\d-]/g, '');
    }
    if (!stringValue) return '';

    // Cắt dấu trừ (nếu có)
    const isNegative = stringValue.startsWith('-');
    const absValue = stringValue.replace('-', '');

    let integerPart = absValue;
    let decimalPart = '';

    if (allowDecimal && absValue.includes('.')) {
      const parts = absValue.split('.');
      integerPart = parts[0];
      decimalPart = '.' + parts[1];
    }

    // Thêm phân cách hàng nghìn
    const formatted = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, separator);
    
    return isNegative ? `-${formatted}${decimalPart}` : `${formatted}${decimalPart}`;
  };

  // Cập nhật giá trị hiển thị khi props.value thay đổi từ bên ngoài
  useEffect(() => {
    setDisplayValue(formatNumber(value));
  }, [value, separator, allowDecimal]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    
    // Loại bỏ dấu phân cách hàng nghìn để lấy giá trị gốc (vd: "1.000.000" -> "1000000")
    // Lưu ý: Nếu allowDecimal=true và separator là '.', ta cần cẩn thận không xoá dấu thập phân
    // Vì formatNumber quy chuẩn dấu thập phân là '.'
    let cleanVal = rawVal;
    if (!allowDecimal) {
      cleanVal = cleanVal.replace(new RegExp(`\\${separator}`, 'g'), '');
      if (!/^-?\d*$/.test(cleanVal)) return;
    } else {
      // Đối với allowDecimal, UX phức tạp hơn, ta để formatNumber xử lý
      cleanVal = rawVal.replace(new RegExp(`\\${separator}`, 'g'), '').replace(',', '.');
    }

    // Cập nhật view ngay lập tức để UX tốt
    setDisplayValue(formatNumber(rawVal)); // format từ giá trị người dùng gõ vào
    
    // Trả về giá trị sạch (raw) cho parent (dạng string để tiện xử lý parseFloat)
    onChange(cleanVal);
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      value={displayValue}
      onChange={handleChange}
      className={className}
      {...props}
    />
  );
}
