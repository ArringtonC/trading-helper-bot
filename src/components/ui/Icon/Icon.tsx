import React, { lazy, Suspense, ComponentType } from 'react';
import type { IconType } from 'react-icons';
import type { AntdIconProps } from '@ant-design/icons/lib/components/AntdIcon';
import type { SVGProps } from 'react';

// Loading component for icons (optional, since icons are small)
const IconLoading = () => <span className="inline-block w-4 h-4" />;

interface IconProps {
  type: 'ant' | 'hero' | 'react';
  name: keyof typeof commonIcons.ant | keyof typeof commonIcons.hero | keyof typeof commonIcons.react;
  className?: string;
  [key: string]: any;
}

type LazyIconComponent = React.LazyExoticComponent<ComponentType<any>>;

// Pre-define commonly used icons
const commonIcons = {
  ant: {
    CheckOutlined: lazy(() => import('@ant-design/icons/CheckOutlined')),
    CloseOutlined: lazy(() => import('@ant-design/icons/CloseOutlined')),
    // Add more as needed
  },
  hero: {
    CheckIcon: lazy(() => import('@heroicons/react/24/outline/CheckIcon')),
    XMarkIcon: lazy(() => import('@heroicons/react/24/outline/XMarkIcon')),
    // Add more as needed
  },
  react: {
    FiCheck: lazy(() => import('react-icons/fi').then(module => ({ default: module.FiCheck as ComponentType<any> }))),
    FiX: lazy(() => import('react-icons/fi').then(module => ({ default: module.FiX as ComponentType<any> }))),
    // Add more as needed
  }
} as const;

export const Icon: React.FC<IconProps> = ({ type, name, className = '', ...props }) => {
  // Get the icon from our pre-defined list
  const IconComponent = commonIcons[type][name as keyof (typeof commonIcons)[typeof type]] as LazyIconComponent;
  
  if (!IconComponent) {
    console.warn(`Icon ${name} of type ${type} not found in pre-defined list`);
    return null;
  }

  return (
    <Suspense fallback={<IconLoading />}>
      <IconComponent className={className} {...props} />
    </Suspense>
  );
}; 