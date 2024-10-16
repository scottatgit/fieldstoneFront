import {
  Box,
  Flex,
  Button,
  Text,
  Link as ChakraLink,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import { RootState } from '../redux/store';
import { logoutUser } from '../redux/actions/authActions';
import RegisterModal from './RegisterModal';
import LoginModal from './LoginModal';
import { ChevronDownIcon, SettingsIcon } from '@chakra-ui/icons'; // Icon for the dropdown
import NextLink from 'next/link';
import { FaBell } from 'react-icons/fa'; // Import Font Awesome icons

const Navbar = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, user } = useAppSelector((state: RootState) => state.auth);

  // States for Login/Register modals
  const [isLoginOpen, setLoginOpen] = useState(false);
  const [isRegisterOpen, setRegisterOpen] = useState(false);

  // Get the first name of the logged-in user by splitting the full name on spaces
  const firstName = user?.name?.split(" ")[0] || "";

  // State to disable the Sign-Up button
  const [isSignUpDisabled, setSignUpDisabled] = useState(false); // Set true to disable the button initially

  // Enable Sign-Up button only in production
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      setSignUpDisabled(false);
    }
  }, []);

  // State to manage client-side rendering (to avoid hydration issues)
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleLogout = () => {
    dispatch(logoutUser());
  };

  // Return null or a loading spinner while rendering on the server to prevent mismatch
  if (!isClient) {
    return null;
  }

  return (
    <Box as="nav" bg="gray.100" p="4" borderBottom="1px solid #ccc">
      <Flex justify="space-between" align="center" className="max-w-7xl mx-auto">
        {/* Logo and Links */}
        <Flex align="center" gap="4">
          {/* Logo */}
          <NextLink href="/" passHref>
          <ChakraLink cursor="pointer" rel="noopener noreferrer">
            Fieldstone
          </ChakraLink>
        </NextLink>

          {/* Conditional Links for authenticated users */}
          {isAuthenticated && (
            <>
              
              <NextLink href="/analytics" passHref>
                <ChakraLink cursor="pointer">
                  <FaBell /> {/* Notification Icon */}
                </ChakraLink>
              </NextLink>

              
            </>
          )}
        </Flex>

        {/* Authentication Buttons */}
        <Flex gap="4" align="center">
          {!isAuthenticated ? (
            <>
              <Button colorScheme="blue" onClick={() => setLoginOpen(true)}>
                Login
              </Button>
              <Button
                colorScheme="green"
                onClick={() => setRegisterOpen(true)}
                isDisabled={isSignUpDisabled}
                _disabled={{ opacity: 0.6, cursor: 'not-allowed' }} // Styling for disabled state
              >
                Sign Up
              </Button>
            </>
          ) : (
            <>
              <Text>Welcome {firstName}</Text>

              {/* Dropdown Menu */}
              <Menu>
                <MenuButton as={Button} rightIcon={<ChevronDownIcon />}>
                  Account
                </MenuButton>
                <MenuList>
                  <MenuItem icon={<SettingsIcon />}>Account Settings</MenuItem>
                  <NextLink href="/reset-password" passHref>
                    <MenuItem>Change Password</MenuItem>
                  </NextLink>
                  <NextLink href="/analytics" passHref>
                    <MenuItem>Analytics</MenuItem>
                  </NextLink>
                  {user?.role === 'admin' && (
                    <NextLink href="/admin" passHref>
                      <MenuItem>Admin</MenuItem>
                    </NextLink>
                  )}
                  <MenuDivider />
                  <MenuItem color="red.500" onClick={handleLogout}>
                    Logout
                  </MenuItem>
                </MenuList>
              </Menu>
            </>
          )}
        </Flex>
      </Flex>

      {/* Modals for Login and Register */}
      <LoginModal isOpen={isLoginOpen} onClose={() => setLoginOpen(false)} />
      <RegisterModal isOpen={isRegisterOpen} onClose={() => setRegisterOpen(false)} />
    </Box>
  );
};

export default Navbar;
