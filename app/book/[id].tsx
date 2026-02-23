import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useColorScheme,
} from 'react-native';
import type { Book, BookDetailParams } from '../../types/book';

const BOOKS_API_BASE = 'https://www.googleapis.com/books/v1/volumes';
const BOOKS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_BOOKS_API_KEY;

function getApiErrorMessage(error: unknown): string {
    if (error instanceof TypeError && error.message.includes('fetch')) {
        return 'Unable to connect. Check your internet connection and try again.';
    }
    if (error instanceof Error) {
        if (error.message.startsWith('API error: 429')) return 'Too many requests. Please try again in a moment.';
        if (error.message.startsWith('API error: 5')) return 'Something went wrong on our end. Please try again later.';
        if (error.message.startsWith('API error: 4')) return 'Book could not be loaded. Please try again.';
    }
    return 'Something went wrong. Please try again.';
}

export async function fetchBookById(id: string): Promise<{ book: Book | null; error: string | null }> {
    try {
        const params = new URLSearchParams(BOOKS_API_KEY ? { key: BOOKS_API_KEY } : {});
        const res = await fetch(`${BOOKS_API_BASE}/${encodeURIComponent(id)}?${params}`);
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        const book = await res.json();
        return { book, error: null };
    } catch (e) {
        console.error('Failed to fetch book:', e);
        return { book: null, error: getApiErrorMessage(e) };
    }
}

// ─── Star Rating (reused from search.tsx) ──────────────────────────────────────

function StarRating({ rating }: { rating?: number }) {
    const filled = rating != null ? Math.min(5, Math.round(rating)) : 0;
    return (
        <View style={styles.stars}>
            {Array.from({ length: 5 }).map((_, i) => (
                <Ionicons
                    key={i}
                    name={i < filled ? 'star' : 'star-outline'}
                    size={20}
                    color="#FFC107"
                    style={styles.starIcon}
                />
            ))}
        </View>
    );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function BookDetailScreen() {
    const params = useLocalSearchParams() as unknown as BookDetailParams;
    const router = useRouter();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const [fetched, setFetched] = useState<Book | null>(null);
    const [loading, setLoading] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null);

    const id = params.id;
    const hasParams = Boolean(params.title || params.thumbnail);

    const loadBook = () => {
        if (!id || hasParams) return;
        setFetchError(null);
        setLoading(true);
        fetchBookById(id).then(({ book, error }) => {
            setFetched(book ?? null);
            setFetchError(error ?? (book ? null : 'Book not found. It may have been removed or the link is invalid.'));
        }).finally(() => setLoading(false));
    };

    useEffect(() => {
        if (!id) return;
        if (hasParams) return;
        let cancelled = false;
        setLoading(true);
        setFetchError(null);
        fetchBookById(id).then(({ book, error }) => {
            if (!cancelled) {
                setFetched(book ?? null);
                setFetchError(error ?? (book ? null : 'Book not found. It may have been removed or the link is invalid.'));
            }
        }).finally(() => {
            if (!cancelled) setLoading(false);
        });
        return () => { cancelled = true; };
    }, [id, hasParams]);

    const info = fetched?.volumeInfo;
    const title = params.title || info?.title || '';
    const authors = params.authors ?? (info?.authors?.join(', ') || 'Unknown');
    const ratingNum = params.rating ? parseFloat(params.rating) : (info?.averageRating ?? undefined);
    const thumbnail = params.thumbnail ?? info?.imageLinks?.thumbnail ?? info?.imageLinks?.smallThumbnail ?? info?.imageLinks?.small ?? info?.imageLinks?.medium ?? info?.imageLinks?.large;
    const description = params.description ?? info?.description;
    const cleanDescription =
        description?.replace(/<[^>]+>/g, '').trim() || 'No description available.';
    const imageUrl = thumbnail?.replace('http://', 'https://');

    if (!id) {
        return (
            <View style={[styles.container, styles.center, isDark && styles.containerDark]}>
                <Text style={[styles.errorText, isDark && styles.errorTextDark]}>Invalid book</Text>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Text style={styles.backButtonText}>Go back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (!hasParams && loading) {
        return (
            <View style={[styles.container, styles.center, isDark && styles.containerDark]}>
                <ActivityIndicator size="large" color="#5C6BC0" />
            </View>
        );
    }

    if (!hasParams && fetchError) {
        return (
            <View style={[styles.container, styles.center, isDark && styles.containerDark]}>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={isDark ? '#A5B4FC' : '#5C6BC0'} />
                </TouchableOpacity>
                <View style={styles.errorState}>
                    <Ionicons name="alert-circle" size={56} color="#9E9E9E" style={{ marginBottom: 16 }} />
                    <Text style={[styles.errorTitle, isDark && styles.errorTitleDark]}>Couldn't load book</Text>
                    <Text style={[styles.errorText, isDark && styles.errorTextDark]}>{fetchError}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={loadBook}>
                        <Text style={styles.retryButtonText}>Try again</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Text style={styles.backButtonText}>Go back</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.container, isDark && styles.containerDark]}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                <Ionicons
                    name="arrow-back"
                    size={24}
                    color={isDark ? '#A5B4FC' : '#5C6BC0'}
                />
            </TouchableOpacity>

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Cover */}
                {imageUrl ? (
                    <Image source={{ uri: imageUrl }} style={styles.cover} resizeMode="cover" />
                ) : (
                    <View style={[styles.cover, styles.coverPlaceholder]}>
                        <Ionicons name="book" size={64} color="#9E9E9E" />
                    </View>
                )}

                {/* Title */}
                <Text style={[styles.title, isDark && styles.textDark]}>{title || 'Untitled'}</Text>

                {/* Authors */}
                <Text style={[styles.authors, isDark && styles.authorsDark]}>by {authors}</Text>

                {/* Rating */}
                <StarRating rating={ratingNum} />

                {/* Description */}
                <View style={styles.descriptionBlock}>
                    <Text style={[styles.descriptionLabel, isDark && styles.textDark]}>
                        Description
                    </Text>
                    <Text
                        style={[styles.description, isDark && styles.descriptionDark]}
                        selectable
                    >
                        {cleanDescription}
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F8F8',
    },
    containerDark: {
        backgroundColor: '#121212',
    },
    backBtn: {
        padding: 16,
        paddingTop: 56,
        alignSelf: 'flex-start',
    },
    scroll: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingBottom: 40,
        alignItems: 'center',
    },
    cover: {
        width: 180,
        height: 270,
        borderRadius: 8,
        marginBottom: 20,
    },
    coverPlaceholder: {
        backgroundColor: '#EEEEEE',
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: '#212121',
        textAlign: 'center',
        marginBottom: 8,
    },
    textDark: {
        color: '#F5F5F5',
    },
    authors: {
        fontSize: 16,
        color: '#757575',
        marginBottom: 12,
    },
    authorsDark: {
        color: '#B0B0B0',
    },
    stars: {
        flexDirection: 'row',
        marginBottom: 24,
    },
    starIcon: {
        marginRight: 4,
    },
    descriptionBlock: {
        width: '100%',
    },
    descriptionLabel: {
        fontSize: 18,
        fontWeight: '700',
        color: '#212121',
        marginBottom: 8,
    },
    description: {
        fontSize: 15,
        lineHeight: 22,
        color: '#424242',
    },
    descriptionDark: {
        color: '#E0E0E0',
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    errorTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#212121',
        marginBottom: 8,
        textAlign: 'center',
    },
    errorTitleDark: {
        color: '#F5F5F5',
    },
    errorText: {
        fontSize: 15,
        color: '#757575',
        textAlign: 'center',
        marginBottom: 24,
    },
    errorTextDark: {
        color: '#B0B0B0',
    },
    retryButton: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        backgroundColor: '#5C6BC0',
        borderRadius: 8,
        marginBottom: 12,
    },
    retryButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    backButton: {
        marginTop: 16,
        paddingVertical: 12,
        paddingHorizontal: 24,
    },
    backButtonText: {
        fontSize: 16,
        color: '#5C6BC0',
        fontWeight: '600',
    },
});
