# If CFLAGS and CXXFLAGS are unset, default to empty.
# This is to tell automake not to include '-g' if C{XX,}FLAGS is not set.
# For more info - http://www.gnu.org/software/automake/manual/autoconf.html#C_002b_002b-Compiler
if test -z "$CXXFLAGS"; then
    CXXFLAGS=""
fi
if test -z "$CFLAGS"; then
    CFLAGS=""
fi

AC_PROG_CC
AC_PROG_CXX

dnl AC_PROG_CC_C99 is previously called in config.m4, but AC_PROG_CC resets CC
dnl so call it once more to ensure C99 remains enabled
AC_PROG_CC_C99

# Check that an appropriate C compiler is available.
c_compiler="unknown"
AC_LANG_PUSH([C])
AC_COMPILE_IFELSE([AC_LANG_PROGRAM([
#if !(defined(__GNUC__) && !defined(__clang__) && !defined(__INTEL_COMPILER))
#error Not a supported GCC compiler
#endif
#if defined(__GNUC__)
#define GCC_VERSION (__GNUC__ * 10000 \
                     + __GNUC_MINOR__ * 100 \
                     + __GNUC_PATCHLEVEL__)
#if GCC_VERSION < 40100
#error Not a supported GCC compiler
#endif
#endif
])], [c_compiler="gcc"], [])

# If our BEGIN_IGNORE_DEPRECATIONS macro won't work, pass
# -Wno-deprecated-declarations

AC_COMPILE_IFELSE([AC_LANG_PROGRAM([
#if !defined(__clang__) && defined(__GNUC__)
#define GCC_VERSION (__GNUC__ * 10000 \
                     + __GNUC_MINOR__ * 100 \
                     + __GNUC_PATCHLEVEL__)
#if GCC_VERSION < 40600
#error Does not support deprecation warning pragmas
#endif
#endif
])], [], [STD_CFLAGS="$STD_CFLAGS -Wno-deprecated-declarations"])

AC_COMPILE_IFELSE([AC_LANG_PROGRAM([
#if defined(__clang__)
#define CLANG_VERSION (__clang_major__ * 10000 \
                       + __clang_minor__ * 100 \
                       + __clang_patchlevel__)
#if CLANG_VERSION < 30300
#error Not a supported Clang compiler
#endif
#endif
])], [c_compiler="clang"], [])
AC_COMPILE_IFELSE([AC_LANG_PROGRAM([
#if !(defined(__SUNPRO_C))
#error Not a supported Sun compiler
#endif
])], [c_compiler="sun"], [])

# The type of parameters for accept, getpeername, getsockname, getsockopt
# all vary the same way by platform.
AX_PROTOTYPE(accept, [
   #include <sys/types.h>
   #include <sys/socket.h>
], [
   int a = 0;
   ARG2 *b = 0;
   ARG3 *c = 0;
   accept (a, b, c);],
ARG2, [struct sockaddr, void],
ARG3, [socklen_t, size_t, int])

MONGOC_SOCKET_ARG2="$ACCEPT_ARG2"
AC_SUBST(MONGOC_SOCKET_ARG2)
MONGOC_SOCKET_ARG3="$ACCEPT_ARG3"
AC_SUBST(MONGOC_SOCKET_ARG3)

AC_LANG_POP([C])

if test "$c_compiler" = "unknown"; then
    AC_MSG_ERROR([Compiler GCC >= 4.1 or Clang >= 3.3 is required for C compilation])
fi

AC_C_CONST
AC_C_INLINE
AC_C_TYPEOF
