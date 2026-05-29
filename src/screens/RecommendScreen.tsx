import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet, Alert, Linking } from 'react-native';

interface Props { userSkinType: string; onNavigate: (s: string) => void; }

const products = [
  { id: 'p1', name: '모이스처라이징 선 크림', desc: '건성 피부를 위한 수분 잠금 보호막. 백탁 없이 투명하게 밀착됩니다.', price: 28000, category: 'suncare', best: true, tag: 'DSPW 추천', image: { uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAN4TG2bgjFRmd4Uz0MGNUj7fqlSaaHN85FeTE7jXDW8CXDxOBWPIR6Nv6PctwUBeTPahkSBytvT7TBk8UjgdlhieuryKqZ4mt99IsAmWoKS9NraH33JRS6s1Isfz2Zd1UQZKbDROMZSpn0gOBUsE6_mCUiIxYtLEd0TZD9euhAwHwTUD498XFnZtjIZk__5zwZTTa4EU3zheUrQiVScrN6QsdhmsmvwhpIUuHL364Cb7hmCQLp8Q7O0epNT3_XLKv_2Pj4Mf6NvTr7' } },
  { id: 'p2', name: '수딩 선 스틱', desc: '민감한 부위에도 자극 없이. 덧바르기 쉬운 휴대용 진정 선케어 솔루션.', price: 22500, category: 'suncare', best: false, image: { uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAK8DDZwLr0N6fTfT0zoEHUDhHizwIYiCeSCl1Ie885lfQjztfKbi8yZb7Z_blWGF4LTe5Ak4mTiJ7nbiuji-Ipp2Aasumb522NZz5UWqct13rp0UortAt9UPTyuHX-m5JfNPxYI0Iuo3ITvS9gZKcSb1Vu3fvhOigSMmhASf-KXe1fB516ZEYaHGMMUTRjppSKtCF_htMQxqMFIUtQ2dtOyfYVbXFKhtFK1wqNqOQbGV2NTENcjaiSdFWc9O-npTA-brV4n-HJYos0' } },
  { id: 'p3', name: '건성용 클렌징 오일', desc: '메이크업과 노폐물을 부드럽게 녹여내는 고보습 오일.', price: 31000, category: 'cleansing', best: false, tag: '저자극', image: { uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuClTchup5IsPZSyBlRtuimavr8s6cbQbj68Nxr06Wnp4Nik445Y0RODUhIK46LVaVnTmC-FnPLbudsoaQUFfKh-jGwViF-9UNPdNApqc6amAf8zP4_-_zroRO91fFMCE5qnQiaTBLifJETsuDSFxmAo7KqIDmmaWPhVV6RajjBuOpKgzPjbAv7tAlT-A3Tagr9yubmT-M3mZWzWpu4fzk7n-VnWT-zGVSegu4HgGDO9TsPYjomag9Q4LrSnxLmEBIBJMDQI5y1gMgZT' } },
  { id: 'p4', name: '순한 클렌징 밀크', desc: '약산성 포뮬러로 세안 후에도 당김없는 부드러움을 유지하는 로션 타입.', price: 19000, category: 'cleansing', best: false, image: { uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDmfVeA7BV0b5o-uYeoiOeGGUN6pgXMaN_gzj8viiv8ZOD5BbSRntkrybeptyELPaZSlEFm_62OQ_BJF7DNIseTulfRLyglqC75i_P4F07A_2iMaBgtQCuJC1siUeM04ApmQE6FuU7lImXeEdba-nTQCysVpviLzFPkwQn8JwcZ4cAyQvAk65yOwsmnnxYRIIBtclyG-rcrDo0ZsCYCR5rhHJG0vz0rUhpBPvks-_IibJw3A9c1PP5BoqMRBPhAfzPXFf_At2ewwXuN' } },
];

type Cat = 'all' | 'suncare' | 'cleansing';

export default function RecommendScreen({ userSkinType, onNavigate }: Props) {
  const [cat, setCat] = useState<Cat>('all');
  const filtered = products.filter(p => cat === 'all' || p.category === cat);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* 배너 */}
      <View style={styles.banner}>
        <Text style={styles.bannerSub}>{userSkinType} 맞춤형 제안</Text>
        <Text style={styles.bannerDesc}>사용자의 {userSkinType} 타입을 분석하여{'\n'}가장 적합한 솔루션을 매칭해 드립니다.</Text>
      </View>

      {/* 카테고리 탭 */}
      <View style={styles.tabRow}>
        {(['all', 'suncare', 'cleansing'] as Cat[]).map(c => (
          <TouchableOpacity key={c} style={[styles.tab, cat === c && styles.tabActive]} onPress={() => setCat(c)}>
            <Text style={[styles.tabTxt, cat === c && styles.tabTxtActive]}>
              {c === 'all' ? '전체' : c === 'suncare' ? '선케어' : '클렌징'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 제품 목록 */}
      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>{cat === 'all' ? '추천 제품 라인업' : cat === 'suncare' ? '추천 자외선 차단제' : '추천 저자극 클렌저'}</Text>
        <View style={styles.recoBadge}><Text style={styles.recoBadgeTxt}>{userSkinType} 추천</Text></View>
      </View>

      {filtered.map(p => (
        <View key={p.id} style={styles.productCard}>
          <View style={styles.imageWrap}>
            <Image source={p.image} style={styles.productImg} resizeMode="cover" />
            {p.best && <View style={styles.bestBadge}><Text style={styles.bestTxt}>BEST</Text></View>}
          </View>
          <View style={styles.productBody}>
            {p.tag && <View style={styles.tagWrap}><Text style={styles.tagTxt}>{p.tag}</Text></View>}
            <Text style={styles.productName}>{p.name}</Text>
            <Text style={styles.productDesc}>{p.desc}</Text>
            <View style={styles.priceRow}>
              <Text style={styles.price}>₩{p.price.toLocaleString()}</Text>
              <TouchableOpacity style={styles.buyBtn} onPress={() => {
                const url = `https://search.shopping.naver.com/search/all?query=${encodeURIComponent(p.name)}`;
                Linking.openURL(url).catch(() => Alert.alert('오류', '구매 링크를 열 수 없습니다.'));
              }}>
                <Text style={styles.buyTxt}>구매하기 ↗</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ))}
      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa', paddingHorizontal: 16 },
  banner: { backgroundColor: '#ff9500', borderRadius: 16, padding: 20, marginTop: 12 },
  bannerSub: { color: 'rgba(255,255,255,0.9)', fontSize: 14, fontWeight: '700' },
  bannerDesc: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 4, lineHeight: 18 },
  tabRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
  tab: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 99, backgroundColor: '#fff', borderWidth: 1, borderColor: '#eee' },
  tabActive: { backgroundColor: '#8c5000', borderColor: '#8c5000' },
  tabTxt: { fontSize: 12, fontWeight: '700', color: '#888' },
  tabTxtActive: { color: '#fff' },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingBottom: 10, borderBottomWidth: 1, borderColor: '#eee' },
  listTitle: { fontSize: 16, fontWeight: '800', color: '#1a1a1a' },
  recoBadge: { backgroundColor: '#ffdbc9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 },
  recoBadgeTxt: { fontSize: 11, fontWeight: '700', color: '#934b19' },
  productCard: { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', marginTop: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  imageWrap: { position: 'relative' },
  productImg: { width: '100%', height: 180 },
  bestBadge: { position: 'absolute', top: 10, right: 10, backgroundColor: '#ff9500', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  bestTxt: { color: '#643700', fontSize: 11, fontWeight: '900' },
  productBody: { padding: 16 },
  tagWrap: { backgroundColor: '#ffdad6', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, alignSelf: 'flex-start', marginBottom: 6 },
  tagTxt: { fontSize: 10, fontWeight: '700', color: '#93000a' },
  productName: { fontSize: 16, fontWeight: '800', color: '#1a1a1a' },
  productDesc: { fontSize: 12, color: '#777', marginTop: 4, lineHeight: 18 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderColor: '#f0f0f0' },
  price: { fontSize: 16, fontWeight: '900', color: '#8c5000', fontVariant: ['tabular-nums'] },
  buyBtn: { backgroundColor: '#f5f5f5', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 },
  buyTxt: { fontSize: 12, fontWeight: '700', color: '#444' },
});
