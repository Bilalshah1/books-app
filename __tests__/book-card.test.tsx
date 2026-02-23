import React from 'react';
import renderer from 'react-test-renderer';
import BookCard from '../components/book-card';
import type { Book } from '../types/book';

const mockBook: Book = {
    id: '1',
    volumeInfo: {
        title: 'Test Book',
        authors: ['Author One', 'Author Two'],
        imageLinks: {
            thumbnail: 'https://example.com/thumbnail.jpg',
        },
    },
};

describe('BookCard', () => {
    it('renders correctly with all props', () => {
        const tree = renderer.create(<BookCard book={mockBook} />).toJSON();
        expect(tree).toMatchSnapshot();
    });

    it('renders correctly without authors', () => {
        const bookWithoutAuthors: Book = {
            ...mockBook,
            volumeInfo: {
                ...mockBook.volumeInfo,
                authors: undefined,
            },
        };
        const tree = renderer.create(<BookCard book={bookWithoutAuthors} />).toJSON();
        expect(tree).toMatchSnapshot();
    });

    it('renders correctly without image', () => {
        const bookWithoutImage: Book = {
            ...mockBook,
            volumeInfo: {
                ...mockBook.volumeInfo,
                imageLinks: undefined,
            },
        };
        const tree = renderer.create(<BookCard book={bookWithoutImage} />).toJSON();
        expect(tree).toMatchSnapshot();
    });

    it('displays book title', () => {
        const component = renderer.create(<BookCard book={mockBook} />);
        const titleText = component.root.findByProps({ children: 'Test Book' });
        expect(titleText).toBeTruthy();
    });

    it('displays authors joined by comma', () => {
        const component = renderer.create(<BookCard book={mockBook} />);
        const authorsText = component.root.findByProps({ children: 'Author One, Author Two' });
        expect(authorsText).toBeTruthy();
    });
});