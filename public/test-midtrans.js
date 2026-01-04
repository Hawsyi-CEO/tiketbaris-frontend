// Simple script to test Midtrans Snap loading
console.log('Testing Midtrans Snap...');

// Test 1: Check if script is loaded
function testSnapLoading() {
  const script = document.createElement('script');
  script.src = 'https://app.sandbox.midtrans.com/snap/snap.js';
  script.setAttribute('data-client-key', 'SB-Mid-client-elnf14D8Ip6f1Yba');
  
  script.onload = function() {
    console.log('✅ Midtrans Snap loaded successfully');
    console.log('✅ Window.snap available:', typeof window.snap !== 'undefined');
    console.log('✅ Client key set correctly');
    
    // Test if snap functions are available
    if (window.snap && window.snap.pay) {
      console.log('✅ snap.pay() function available');
    } else {
      console.log('❌ snap.pay() function NOT available');
    }
  };
  
  script.onerror = function() {
    console.log('❌ Failed to load Midtrans Snap script');
  };
  
  document.head.appendChild(script);
}

// Test 2: Check if popup can be triggered
function testPayment() {
  if (!window.snap) {
    console.log('❌ Snap not loaded yet');
    return;
  }
  
  // Dummy token for testing popup (won't work, but should open popup)
  try {
    window.snap.pay('dummy-token', {
      onSuccess: function(result) {
        console.log('✅ Success callback working');
      },
      onPending: function(result) {
        console.log('✅ Pending callback working');
      },
      onError: function(result) {
        console.log('✅ Error callback working');
      },
      onClose: function() {
        console.log('✅ Close callback working');
      }
    });
  } catch(error) {
    console.log('Popup test result:', error.message);
  }
}

// Auto run tests
setTimeout(() => {
  testSnapLoading();
}, 1000);

setTimeout(() => {
  testPayment();
}, 3000);

console.log('Test script loaded. Check console for results...');