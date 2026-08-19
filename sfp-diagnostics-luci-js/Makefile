include $(TOPDIR)/rules.mk

PKG_NAME:=sfp-diagnostics-luci-js
PKG_VERSION:=4
PKG_RELEASE:=2

PKG_SOURCE_PROTO:=git
PKG_SOURCE_URL:=https://github.com/Payti/sfp-diagnostics-luci-js.git
PKG_SOURCE_DATE:=2026-08-19
PKG_SOURCE_VERSION:=ebe4fdaa9d97c90604ea13a8257651e999556870
PKG_MIRROR_HASH:=skip
PKG_SOURCE_SUBDIR:=$(PKG_NAME)-$(PKG_VERSION)

include $(INCLUDE_DIR)/package.mk

define Package/sfp-diagnostics-luci-js
  SECTION:=luci
  CATEGORY:=LuCI
  SUBMENU:=Applications
  TITLE:=SFP diagnostics for LuCI
  DEPENDS:=+rpcd-mod-ucode +luci-mod-admin-full +libc +ethtool-full
  PKGARCH:=all
endef

define Package/sfp-diagnostics-luci-js/description
 LuCI diagnostics page for SFP modules on OpenWrt 25.12.
 Reads DDM values from the textual output of ethtool -m.
endef

define Build/Compile
endef

define Package/sfp-diagnostics-luci-js/install
	$(INSTALL_DIR) $(1)/etc
	$(INSTALL_DATA) $(PKG_BUILD_DIR)/etc/sfp.json $(1)/etc/sfp.json

	$(INSTALL_DIR) $(1)/usr/libexec/rpcd
	$(INSTALL_BIN) $(PKG_BUILD_DIR)/usr/libexec/rpcd/sfp $(1)/usr/libexec/rpcd/sfp

	$(INSTALL_DIR) $(1)/usr/share/luci/menu.d
	$(INSTALL_DATA) $(PKG_BUILD_DIR)/usr/share/luci/menu.d/sfp-diagnostics-luci-menud.json $(1)/usr/share/luci/menu.d/sfp-diagnostics-luci-menud.json

	$(INSTALL_DIR) $(1)/usr/share/rpcd/acl.d
	$(INSTALL_DATA) $(PKG_BUILD_DIR)/usr/share/rpcd/acl.d/sfp-diagnostics-luci-acld.json $(1)/usr/share/rpcd/acl.d/sfp-diagnostics-luci-acld.json

	$(INSTALL_DIR) $(1)/www/luci-static/resources/view/network
	$(INSTALL_DATA) $(PKG_BUILD_DIR)/www/luci-static/resources/view/network/sfp.js $(1)/www/luci-static/resources/view/network/sfp.js
endef

$(eval $(call BuildPackage,sfp-diagnostics-luci-js))