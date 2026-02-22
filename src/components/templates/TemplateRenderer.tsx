import { ProductData, TemplateId } from '../../types';
import { getCustomTemplateById } from '../../store';
import { ElegantDark } from './ElegantDark';
import { FreshGradient } from './FreshGradient';
import { MinimalWhite } from './MinimalWhite';
import { BoldVibrant } from './BoldVibrant';
import { PastelSoft } from './PastelSoft';
import { CustomTemplate } from './CustomTemplate';

interface Props {
  templateId: TemplateId;
  data: ProductData;
}

export function TemplateRenderer({ templateId, data }: Props) {
  switch (templateId) {
    case 'elegant-dark':
      return <ElegantDark data={data} />;
    case 'fresh-gradient':
      return <FreshGradient data={data} />;
    case 'minimal-white':
      return <MinimalWhite data={data} />;
    case 'bold-vibrant':
      return <BoldVibrant data={data} />;
    case 'pastel-soft':
      return <PastelSoft data={data} />;
    default: {
      // Try to load as a custom template
      const config = getCustomTemplateById(templateId);
      if (config) return <CustomTemplate config={config} data={data} />;
      return <ElegantDark data={data} />;
    }
  }
}
