// src/router/routes.ts
import type { RouteRecordRaw } from 'vue-router';

const MainLayout = () => import('@/layouts/MainLayout.vue');

export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: MainLayout,
    redirect: '/dashboard',
    children: [
      // 概要面板
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard/index.vue'),
        meta: {
          title: '概要面板',
          icon: 'House',
          breadcrumb: ['概要面板']
        }
      },
      // 玩家数据报表
      {
        path: 'player-data',
        name: 'PlayerData',
        redirect: '/player-data/role-list',
        meta: {
          title: '玩家数据报表',
          icon: 'DataLine'
        },
        children: [
          {
            path: 'role-list',
            name: 'RoleList',
            component: () => import('@/views/PlayerData/RoleList.vue'),
            meta: {
              title: '角色列表',
              breadcrumb: ['玩家数据报表', '角色列表']
            }
          },
          {
            path: 'order-list',
            name: 'OrderList',
            component: () => import('@/views/PlayerData/OrderList.vue'),
            meta: {
              title: '订单列表',
              breadcrumb: ['玩家数据报表', '订单列表']
            }
          }
        ]
      },
      // 审核管理
      {
        path: 'audit',
        name: 'Audit',
        redirect: '/audit/binding-apply',
        meta: {
          title: '审核管理',
          icon: 'Checked'
        },
        children: [
          {
            path: 'binding-apply',
            name: 'BindingApply',
            component: () => import('@/views/Audit/BindingApply.vue'),
            meta: {
              title: '绑定申请',
              breadcrumb: ['审核', '绑定申请']
            }
          },
          {
            path: 'new-attribution',
            name: 'NewAttribution',
            component: () => import('@/views/Audit/NewAttribution.vue'),
            meta: {
              title: '新增归因更改',
              breadcrumb: ['审核', '新增归因更改']
            }
          }
        ]
      }
    ]
  },
  // 404 页面
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/Error/404.vue')
  }
];

export default routes;
