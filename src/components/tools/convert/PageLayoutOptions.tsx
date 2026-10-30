import type { MarginOption, OrientationOption, PageSizeOption } from '../../../lib/pdf/ops/imagesToPdf';
import { Options, Segmented } from '../../ui/fields';

export interface PageLayout {
  pageSize: PageSizeOption;
  orientation: OrientationOption;
  margin: MarginOption;
}

export const defaultLayout: PageLayout = { pageSize: 'fit', orientation: 'auto', margin: 'none' };

interface Labels {
  pageSizeLabel: string;
  pageSizes: Record<PageSizeOption, string>;
  marginLabel: string;
  margins: Record<MarginOption, string>;
  orientationLabel?: string;
  orientations?: Record<OrientationOption, string>;
  orientationFitHint?: string;
}

/** Page size, orientation and margin for image-to-PDF conversions. Orientation is optional. */
export function PageLayoutOptions({
  value,
  onChange,
  labels,
  disabled,
}: {
  value: PageLayout;
  onChange: (value: PageLayout) => void;
  labels: Labels;
  disabled?: boolean;
}) {
  const sizes: PageSizeOption[] = ['fit', 'a4', 'letter'];
  const margins: MarginOption[] = ['none', 'small', 'large'];
  const orientations: OrientationOption[] = ['auto', 'portrait', 'landscape'];
  const { orientationLabel, orientations: orientationNames } = labels;
  return (
    <Options>
      <Segmented
        label={labels.pageSizeLabel}
        value={value.pageSize}
        options={sizes.map((size) => ({ value: size, label: labels.pageSizes[size] }))}
        onChange={(pageSize) => onChange({ ...value, pageSize })}
        disabled={disabled ?? false}
      />
      {orientationLabel && orientationNames && (
        <div className="field">
          <Segmented
            label={orientationLabel}
            value={value.orientation}
            options={orientations.map((orientation) => ({ value: orientation, label: orientationNames[orientation] }))}
            onChange={(orientation) => onChange({ ...value, orientation })}
            disabled={!!disabled || value.pageSize === 'fit'}
          />
          {value.pageSize === 'fit' && labels.orientationFitHint && (
            <span className="field__hint">{labels.orientationFitHint}</span>
          )}
        </div>
      )}
      <Segmented
        label={labels.marginLabel}
        value={value.margin}
        options={margins.map((margin) => ({ value: margin, label: labels.margins[margin] }))}
        onChange={(margin) => onChange({ ...value, margin })}
        disabled={disabled ?? false}
      />
    </Options>
  );
}
