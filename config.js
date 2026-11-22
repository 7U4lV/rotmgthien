const SKIN_LIST = ['#f4a27a', '#ffdbac', '#e0ac69', '#c68642', '#8d5524'];
const HAIR_LIST = ['Mái Ngang', 'Rẽ Ngôi', 'Búi Đỉnh', 'Tóc Dài', 'Đầu Trọc'];
const OUTFIT_LIST = [
    { name: 'Áo Lam', main: '#46829e', trim: '#6b5344', pants: '#233b46' },
    { name: 'Áo Nâu', main: '#8d6e63', trim: '#5d4037', pants: '#3e2723' },
    { name: 'Áo Vàng', main: '#d89b3c', trim: '#8c5819', pants: '#37474f' },
    { name: 'Áo Hồng', main: '#c96b88', trim: '#7d3c50', pants: '#2d3748' }
];

const MAP_W = 1800;
const MAP_H = 1500;
const ROOM_ID = 'thienvien_v72_room';
const MAX_CONNS = 20;
const MAX_RENDER = 100;
const IDLE_FRAME_MS = 1000 / 24;

let cfg = {
    gender: 'male',
    skin: SKIN_LIST[0],
    hairStyle: 0,
    hairColor: '#1e292e',
    hairShade: '#3d545c',
    outfitId: 0
};
