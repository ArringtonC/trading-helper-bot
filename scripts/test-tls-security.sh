#!/bin/bash

# Trading Helper Bot - TLS 1.3 Security Testing Script
# Created for Task 38.2: Implement TLS 1.3 for All Communications

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default domain (can be overridden)
DOMAIN=${1:-"localhost:3000"}
HTTPS_DOMAIN="https://$DOMAIN"

echo -e "${BLUE}🔒 Trading Helper Bot - TLS 1.3 Security Testing${NC}"
echo -e "${BLUE}=================================================${NC}"
echo -e "Testing domain: ${YELLOW}$DOMAIN${NC}"
echo ""

# Function to check if command exists
check_command() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${RED}❌ $1 is not installed. Please install it first.${NC}"
        return 1
    fi
    return 0
}

# Function to test with timeout
test_with_timeout() {
    timeout 10s "$@" 2>/dev/null || {
        echo -e "${YELLOW}⚠️  Test timed out or failed${NC}"
        return 1
    }
}

echo -e "${BLUE}1. Checking required tools...${NC}"
TOOLS_AVAILABLE=true

if check_command "openssl"; then
    echo -e "${GREEN}✅ OpenSSL available${NC}"
else
    TOOLS_AVAILABLE=false
fi

if check_command "curl"; then
    echo -e "${GREEN}✅ cURL available${NC}"
else
    TOOLS_AVAILABLE=false
fi

if check_command "nmap"; then
    echo -e "${GREEN}✅ Nmap available${NC}"
else
    echo -e "${YELLOW}⚠️  Nmap not available (cipher testing will be skipped)${NC}"
fi

if [ "$TOOLS_AVAILABLE" = false ]; then
    echo -e "${RED}❌ Some required tools are missing. Please install them.${NC}"
    exit 1
fi

echo ""

# Test 1: Basic connectivity
echo -e "${BLUE}2. Testing basic HTTPS connectivity...${NC}"
if curl -s -I "$HTTPS_DOMAIN" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ HTTPS connection successful${NC}"
else
    echo -e "${RED}❌ HTTPS connection failed${NC}"
    echo "   Trying local development server..."
    if curl -s -I "https://localhost:3000" -k > /dev/null 2>&1; then
        HTTPS_DOMAIN="https://localhost:3000"
        DOMAIN="localhost:3000"
        echo -e "${YELLOW}⚠️  Using localhost with self-signed certificate${NC}"
    else
        echo -e "${RED}❌ Cannot connect to any HTTPS endpoint${NC}"
        exit 1
    fi
fi

echo ""

# Test 2: TLS Protocol Testing
echo -e "${BLUE}3. Testing TLS protocol support...${NC}"

# Test TLS 1.3
echo -n "   TLS 1.3: "
if echo | test_with_timeout openssl s_client -connect "${DOMAIN}" -tls1_3 -quiet; then
    echo -e "${GREEN}✅ Supported${NC}"
    TLS13_SUPPORTED=true
else
    echo -e "${RED}❌ Not supported${NC}"
    TLS13_SUPPORTED=false
fi

# Test TLS 1.2 (should be supported as fallback)
echo -n "   TLS 1.2: "
if echo | test_with_timeout openssl s_client -connect "${DOMAIN}" -tls1_2 -quiet; then
    echo -e "${GREEN}✅ Supported${NC}"
else
    echo -e "${YELLOW}⚠️  Not supported${NC}"
fi

# Test TLS 1.1 (should NOT be supported)
echo -n "   TLS 1.1: "
if echo | test_with_timeout openssl s_client -connect "${DOMAIN}" -tls1_1 -quiet; then
    echo -e "${RED}❌ Supported (security risk)${NC}"
else
    echo -e "${GREEN}✅ Not supported (good)${NC}"
fi

# Test TLS 1.0 (should NOT be supported)
echo -n "   TLS 1.0: "
if echo | test_with_timeout openssl s_client -connect "${DOMAIN}" -tls1 -quiet; then
    echo -e "${RED}❌ Supported (security risk)${NC}"
else
    echo -e "${GREEN}✅ Not supported (good)${NC}"
fi

echo ""

# Test 3: Security Headers
echo -e "${BLUE}4. Testing security headers...${NC}"

HEADERS=$(curl -s -I "$HTTPS_DOMAIN" || curl -s -I "$HTTPS_DOMAIN" -k)

check_header() {
    local header_name="$1"
    local expected_pattern="$2"
    local header_value=$(echo "$HEADERS" | grep -i "^$header_name:" | cut -d' ' -f2- | tr -d '\r\n')
    
    if [ -n "$header_value" ]; then
        if [[ "$header_value" =~ $expected_pattern ]] || [ -z "$expected_pattern" ]; then
            echo -e "   ${GREEN}✅ $header_name: $header_value${NC}"
        else
            echo -e "   ${YELLOW}⚠️  $header_name: $header_value (check configuration)${NC}"
        fi
    else
        echo -e "   ${RED}❌ $header_name: Missing${NC}"
    fi
}

check_header "Strict-Transport-Security" "max-age="
check_header "Content-Security-Policy" ""
check_header "X-Frame-Options" "DENY\|SAMEORIGIN"
check_header "X-Content-Type-Options" "nosniff"
check_header "X-XSS-Protection" ""
check_header "Referrer-Policy" ""

echo ""

# Test 4: Certificate Information
echo -e "${BLUE}5. Testing certificate information...${NC}"

CERT_INFO=$(echo | openssl s_client -connect "${DOMAIN}" -servername "${DOMAIN%%:*}" 2>/dev/null | openssl x509 -noout -text 2>/dev/null)

if [ $? -eq 0 ]; then
    echo -n "   Signature Algorithm: "
    SIG_ALG=$(echo "$CERT_INFO" | grep "Signature Algorithm" | head -1 | awk '{print $3}')
    if [[ "$SIG_ALG" =~ (sha256|sha384|sha512) ]]; then
        echo -e "${GREEN}✅ $SIG_ALG${NC}"
    else
        echo -e "${YELLOW}⚠️  $SIG_ALG (consider upgrading)${NC}"
    fi
    
    echo -n "   Public Key Algorithm: "
    PUB_KEY=$(echo "$CERT_INFO" | grep "Public Key Algorithm" | awk '{print $4}')
    echo -e "${GREEN}✅ $PUB_KEY${NC}"
    
    echo -n "   Key Size: "
    KEY_SIZE=$(echo "$CERT_INFO" | grep "Public-Key:" | awk '{print $2}' | tr -d '()')
    if [ -n "$KEY_SIZE" ]; then
        KEY_BITS=$(echo "$KEY_SIZE" | grep -o '[0-9]*')
        if [ "$KEY_BITS" -ge 2048 ]; then
            echo -e "${GREEN}✅ $KEY_SIZE${NC}"
        else
            echo -e "${YELLOW}⚠️  $KEY_SIZE (recommend 2048+ bits)${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  Unable to determine${NC}"
    fi
    
    echo -n "   Certificate Expiry: "
    EXPIRY=$(echo "$CERT_INFO" | grep "Not After" | cut -d':' -f2- | xargs)
    echo -e "${GREEN}✅ $EXPIRY${NC}"
else
    echo -e "${YELLOW}⚠️  Certificate information unavailable${NC}"
fi

echo ""

# Test 5: Cipher Suite Testing (if nmap available)
if command -v nmap &> /dev/null; then
    echo -e "${BLUE}6. Testing cipher suites...${NC}"
    
    CIPHER_RESULT=$(nmap --script ssl-enum-ciphers -p 443 "${DOMAIN%%:*}" 2>/dev/null | grep -A 50 "TLSv1.3\|TLSv1.2")
    
    if [ -n "$CIPHER_RESULT" ]; then
        echo "   TLS 1.3 Ciphers:"
        echo "$CIPHER_RESULT" | grep -A 10 "TLSv1.3" | grep "TLS_" | while read -r line; do
            if [[ "$line" =~ (AES_256_GCM|CHACHA20_POLY1305) ]]; then
                echo -e "   ${GREEN}✅ $line${NC}"
            else
                echo -e "   ${YELLOW}⚠️  $line${NC}"
            fi
        done
    else
        echo -e "   ${YELLOW}⚠️  Unable to enumerate ciphers${NC}"
    fi
else
    echo -e "${BLUE}6. Cipher suite testing skipped (nmap not available)${NC}"
fi

echo ""

# Test 6: HTTP to HTTPS Redirect
echo -e "${BLUE}7. Testing HTTP to HTTPS redirect...${NC}"
HTTP_DOMAIN="http://${DOMAIN}"

REDIRECT_TEST=$(curl -s -I "$HTTP_DOMAIN" -L --max-redirs 1 2>/dev/null || echo "FAILED")

if [[ "$REDIRECT_TEST" =~ "HTTP/1.1 301\|HTTP/2 301\|HTTP/1.1 308\|HTTP/2 308" ]]; then
    if [[ "$REDIRECT_TEST" =~ "Location: https://" ]]; then
        echo -e "${GREEN}✅ HTTP redirects to HTTPS${NC}"
    else
        echo -e "${YELLOW}⚠️  HTTP redirects but not to HTTPS${NC}"
    fi
elif [[ "$REDIRECT_TEST" == "FAILED" ]]; then
    echo -e "${YELLOW}⚠️  HTTP redirect test failed (may be expected for localhost)${NC}"
else
    echo -e "${RED}❌ HTTP does not redirect to HTTPS${NC}"
fi

echo ""

# Test 7: Application Security Test
echo -e "${BLUE}8. Testing application-specific security...${NC}"

# Test CSP header
CSP_HEADER=$(echo "$HEADERS" | grep -i "content-security-policy:" | cut -d' ' -f2-)
if [ -n "$CSP_HEADER" ]; then
    echo -e "   ${GREEN}✅ Content Security Policy configured${NC}"
    if [[ "$CSP_HEADER" =~ "https:" ]]; then
        echo -e "   ${GREEN}✅ CSP allows HTTPS connections${NC}"
    else
        echo -e "   ${YELLOW}⚠️  CSP may not properly restrict to HTTPS${NC}"
    fi
else
    echo -e "   ${YELLOW}⚠️  Content Security Policy not configured${NC}"
fi

# Test for common security files
echo -n "   Security.txt: "
if curl -s "$HTTPS_DOMAIN/.well-known/security.txt" -k | grep -q "Contact:"; then
    echo -e "${GREEN}✅ Present${NC}"
else
    echo -e "${YELLOW}⚠️  Not found${NC}"
fi

echo -n "   Robots.txt: "
if curl -s "$HTTPS_DOMAIN/robots.txt" -k > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Present${NC}"
else
    echo -e "${YELLOW}⚠️  Not found${NC}"
fi

echo ""

# Summary
echo -e "${BLUE}9. Security Test Summary${NC}"
echo -e "${BLUE}========================${NC}"

if [ "$TLS13_SUPPORTED" = true ]; then
    echo -e "${GREEN}✅ TLS 1.3 is supported${NC}"
else
    echo -e "${RED}❌ TLS 1.3 is NOT supported${NC}"
fi

# Overall security rating
SECURITY_SCORE=0
TOTAL_TESTS=7

# Add points for each passed test
[ "$TLS13_SUPPORTED" = true ] && ((SECURITY_SCORE++))
echo "$HEADERS" | grep -q "Strict-Transport-Security" && ((SECURITY_SCORE++))
echo "$HEADERS" | grep -q "Content-Security-Policy" && ((SECURITY_SCORE++))
echo "$HEADERS" | grep -q "X-Frame-Options" && ((SECURITY_SCORE++))
echo "$HEADERS" | grep -q "X-Content-Type-Options" && ((SECURITY_SCORE++))
[[ "$REDIRECT_TEST" =~ "Location: https://" ]] && ((SECURITY_SCORE++))
[ -n "$CSP_HEADER" ] && ((SECURITY_SCORE++))

SECURITY_PERCENTAGE=$((SECURITY_SCORE * 100 / TOTAL_TESTS))

echo ""
echo -e "Security Score: ${BLUE}$SECURITY_SCORE/$TOTAL_TESTS ($SECURITY_PERCENTAGE%)${NC}"

if [ $SECURITY_PERCENTAGE -ge 85 ]; then
    echo -e "${GREEN}🎉 Excellent security configuration!${NC}"
elif [ $SECURITY_PERCENTAGE -ge 70 ]; then
    echo -e "${YELLOW}⚠️  Good security configuration with room for improvement${NC}"
else
    echo -e "${RED}❌ Security configuration needs significant improvement${NC}"
fi

echo ""
echo -e "${BLUE}For detailed SSL/TLS analysis, visit:${NC}"
echo -e "${YELLOW}https://www.ssllabs.com/ssltest/analyze.html?d=${DOMAIN%%:*}${NC}"

echo ""
echo -e "${GREEN}🔒 TLS 1.3 Security Testing Complete!${NC}"

exit 0 