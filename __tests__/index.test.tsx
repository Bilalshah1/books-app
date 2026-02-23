import React from 'react';
import renderer from 'react-test-renderer';
import HomeScreen from '../app/index';

// Mock expo-router
jest.mock('expo-router', () => ({
    useRouter: () => ({
        push: jest.fn(),
    }),
}));

describe('HomeScreen', () => {
    it('renders correctly', () => {
        const tree = renderer.create(<HomeScreen />).toJSON();
        expect(tree).toMatchSnapshot();
    });

    it('navigates to search on search bar press', () => {
        const mockRouter = { push: jest.fn() };
        require('expo-router').useRouter.mockReturnValue(mockRouter);

        const component = renderer.create(<HomeScreen />);

        // Find the TouchableOpacity for search bar
        const searchBar = component.root.findByProps({ activeOpacity: 0.8 });
        searchBar.props.onPress();

        expect(mockRouter.push).toHaveBeenCalledWith('/search');
    });
});
