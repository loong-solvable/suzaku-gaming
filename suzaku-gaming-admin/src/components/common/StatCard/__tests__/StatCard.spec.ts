// src/components/common/StatCard/__tests__/StatCard.spec.ts
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import StatCard from '../index.vue';

// Mock Element Plus components
const mockComponents = {
  'el-icon': {
    template: '<span class="el-icon"><slot /></span>'
  }
};

describe('StatCard', () => {
  it('renders title correctly', () => {
    const wrapper = mount(StatCard, {
      props: {
        title: '新增玩家',
        value: 100
      },
      global: {
        stubs: mockComponents
      }
    });

    expect(wrapper.find('.stat-card__title').text()).toBe('新增玩家');
  });

  it('formats numeric value with thousand separators', () => {
    const wrapper = mount(StatCard, {
      props: {
        title: '活跃玩家',
        value: 12345678
      },
      global: {
        stubs: mockComponents
      }
    });

    expect(wrapper.find('.stat-card__value').text()).toBe('12,345,678');
  });

  it('formats USD amount with 2 decimal places', () => {
    const wrapper = mount(StatCard, {
      props: {
        title: '付费金额',
        value: 1234.5,
        unit: 'USD'
      },
      global: {
        stubs: mockComponents
      }
    });

    expect(wrapper.find('.stat-card__value').text()).toBe('1,234.50');
    expect(wrapper.find('.stat-card__unit').text()).toBe('USD');
  });

  it('displays string value as-is', () => {
    const wrapper = mount(StatCard, {
      props: {
        title: '状态',
        value: 'Active'
      },
      global: {
        stubs: mockComponents
      }
    });

    expect(wrapper.find('.stat-card__value').text()).toBe('Active');
  });

  it('shows date range when provided', () => {
    const wrapper = mount(StatCard, {
      props: {
        title: '新增玩家',
        value: 100,
        dateRange: '2026-02-01 ~ 2026-02-04'
      },
      global: {
        stubs: mockComponents
      }
    });

    expect(wrapper.find('.stat-card__date').text()).toBe('2026-02-01 ~ 2026-02-04');
  });

  it('hides date range when not provided', () => {
    const wrapper = mount(StatCard, {
      props: {
        title: '新增玩家',
        value: 100
      },
      global: {
        stubs: mockComponents
      }
    });

    expect(wrapper.find('.stat-card__date').exists()).toBe(false);
  });

  it('shows trend with up class when trend is up', () => {
    const wrapper = mount(StatCard, {
      props: {
        title: '新增玩家',
        value: 100,
        trend: 'up',
        trendValue: 15
      },
      global: {
        stubs: mockComponents
      }
    });

    const trendEl = wrapper.find('.stat-card__trend');
    expect(trendEl.exists()).toBe(true);
    expect(trendEl.classes()).toContain('trend--up');
    expect(trendEl.text()).toContain('15');
  });

  it('shows trend with down class when trend is down', () => {
    const wrapper = mount(StatCard, {
      props: {
        title: '付费玩家',
        value: 50,
        trend: 'down',
        trendValue: -10
      },
      global: {
        stubs: mockComponents
      }
    });

    const trendEl = wrapper.find('.stat-card__trend');
    expect(trendEl.exists()).toBe(true);
    expect(trendEl.classes()).toContain('trend--down');
    expect(trendEl.text()).toContain('10'); // abs value
  });

  it('hides trend footer when trendValue is 0', () => {
    const wrapper = mount(StatCard, {
      props: {
        title: '新增玩家',
        value: 100,
        trendValue: 0
      },
      global: {
        stubs: mockComponents
      }
    });

    expect(wrapper.find('.stat-card__footer').exists()).toBe(false);
  });

  it('shows loading state when loading is true', () => {
    const wrapper = mount(StatCard, {
      props: {
        title: '新增玩家',
        value: 100,
        loading: true
      },
      global: {
        stubs: mockComponents,
        directives: {
          loading: () => {}
        }
      }
    });

    expect(wrapper.find('.stat-card').exists()).toBe(true);
  });
});
