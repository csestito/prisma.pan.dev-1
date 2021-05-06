/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import isInternalUrl from "@docusaurus/isInternalUrl";
import Link from "@docusaurus/Link";
import { isSamePath, useThemeConfig } from "@docusaurus/theme-common";
import useLockBodyScroll from "@theme/hooks/useLockBodyScroll";
import useScrollPosition from "@theme/hooks/useScrollPosition";
import useUserPreferencesContext from "@theme/hooks/useUserPreferencesContext";
import useWindowSize, { windowSizes } from "@theme/hooks/useWindowSize";
import IconArrow from "@theme/IconArrow";
import IconMenu from "@theme/IconMenu";
import Logo from "@theme/Logo";
import clsx from "clsx";
import React, { useCallback, useEffect, useRef, useState } from "react";
import Select from "react-select";
import AsyncSelect from "react-select/async";
import styles from "./styles.module.css";
const MOBILE_TOGGLE_SIZE = 24;

function usePrevious(value) {
  const ref = useRef(value);
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref.current;
}

const isActiveSidebarItem = (item, activePath) => {
  if (item.type === "link") {
    return isSamePath(item.href, activePath);
  }

  if (item.type === "category") {
    return item.items.some((subItem) =>
      isActiveSidebarItem(subItem, activePath)
    );
  }

  return false;
};

function DocSidebarItemCategory({
  item,
  onItemClick,
  collapsible,
  activePath,
  ...props
}) {
  const { items, label } = item;
  const isActive = isActiveSidebarItem(item, activePath);
  const wasActive = usePrevious(isActive); // active categories are always initialized as expanded
  // the default (item.collapsed) is only used for non-active categories

  const [collapsed, setCollapsed] = useState(() => {
    if (!collapsible) {
      return false;
    }

    return isActive ? false : item.collapsed;
  });
  const menuListRef = useRef(null);
  const [menuListHeight, setMenuListHeight] = useState(undefined);

  const handleMenuListHeight = (calc = true) => {
    setMenuListHeight(
      calc ? `${menuListRef.current?.scrollHeight}px` : undefined
    );
  }; // If we navigate to a category, it should automatically expand itself

  useEffect(() => {
    const justBecameActive = isActive && !wasActive;

    if (justBecameActive && collapsed) {
      setCollapsed(false);
    }
  }, [isActive, wasActive, collapsed]);
  const handleItemClick = useCallback(
    (e) => {
      e.preventDefault();

      if (!menuListHeight) {
        handleMenuListHeight();
      }

      setTimeout(() => setCollapsed((state) => !state), 100);
    },
    [menuListHeight]
  );

  if (items.length === 0) {
    return null;
  }

  return (
    <li
      className={clsx("menu__list-item", {
        "menu__list-item--collapsed": collapsed,
      })}
      key={label}
    >
      <a
        className={clsx("menu__link", {
          "menu__link--sublist": collapsible,
          "menu__link--active": collapsible && isActive,
          [styles.menuLinkText]: !collapsible,
        })}
        onClick={collapsible ? handleItemClick : undefined}
        href={collapsible ? "#!" : undefined}
        {...props}
      >
        {label}
      </a>
      <ul
        className="menu__list"
        ref={menuListRef}
        style={{
          height: menuListHeight,
        }}
        onTransitionEnd={() => {
          if (!collapsed) {
            handleMenuListHeight(false);
          }
        }}
      >
        {items.map((childItem) => (
          <DocSidebarItem
            tabIndex={collapsed ? "-1" : "0"}
            key={childItem.label}
            item={childItem}
            onItemClick={onItemClick}
            collapsible={collapsible}
            activePath={activePath}
          />
        ))}
      </ul>
    </li>
  );
}

function DocSidebarItemLink({
  item,
  onItemClick,
  activePath,
  collapsible: _collapsible,
  ...props
}) {
  const { href, label } = item;
  const isActive = isActiveSidebarItem(item, activePath);
  return (
    <li className="menu__list-item" key={label}>
      <Link
        className={clsx("menu__link", {
          "menu__link--active": isActive,
        })}
        to={href}
        {...(isInternalUrl(href)
          ? {
              isNavLink: true,
              exact: true,
              onClick: onItemClick,
            }
          : {
              target: "_blank",
              rel: "noreferrer noopener",
            })}
        {...props}
      >
        {label}
      </Link>
    </li>
  );
}

function Checkbox({
  item,
  onItemClick,
  activePath,
  collapsible: _collapsible,
  ...props
}) {
  const { name, label, action, state } = item;
  const isActive = isActiveSidebarItem(item, activePath);
  return (
    <li className="menu__list-item" key={label}>
      <span
        className={clsx("menu__link", {
          "menu__link--active": isActive,
        })}
      >
        <label htmlFor={name}>{label}</label>
        <input
          type="checkbox"
          id={name}
          name={name}
          checked={state}
          onChange={() => {
            action(!state);
          }}
        />
      </span>
    </li>
  );
}

function SelectOne({
  item,
  onItemClick,
  activePath,
  collapsible: _collapsible,
  ...props
}) {
  const { label, options, action, async, state } = item;
  const colourStyles = {
    control: (styles) => {
      return {
        ...styles,
        backgroundColor: "var(--ifm-background-color)",
      };
    },
    menu: (styles) => {
      return {
        ...styles,
      };
    },
    menuList: (styles) => {
      return {
        ...styles,
        backgroundColor: "var(--ifm-background-color)",
      };
    },
    option: (styles, { data, isDisabled, isFocused, isSelected }) => {
      return {
        ...styles,
        backgroundColor: isFocused
          ? "var(--ifm-color-primary)"
          : "var(--ifm-background-color)",
        color: isFocused ? "white" : "var(--ifm-font-color-base)",
      };
    },
    singleValue: (styles, { data, isDisabled, isFocused, isSelected }) => {
      return {
        ...styles,
        color: "var(--ifm-font-color-base)",
      };
    },
  };

  if (async) {
    const filterOptions = (inputValue) => {
      return options.filter((i) =>
        i.label.toLowerCase().includes(inputValue.toLowerCase())
      );
    };
    const promiseOptions = (inputValue) =>
      new Promise((resolve) => {
        setTimeout(() => {
          resolve(filterOptions(inputValue));
        }, 1000);
      });
    return (
      <div className={styles.rqlFilterItem} key={label}>
        <AsyncSelect
          placeholder={state ? state : `${label} (${options.length})`}
          onChange={(option) => {
            option ? action(option.value) : action("");
          }}
          isClearable={true}
          cacheOptions
          defaultOptions={options}
          loadOptions={promiseOptions}
        />
      </div>
    );
  }
  return (
    <div className={styles.rqlFilterItem} key={label}>
      <Select
        options={options}
        placeholder={state ? state : `${label} (${options.length})`}
        onChange={(option) => {
          option ? action(option.value) : action("");
        }}
        isClearable={true}
        styles={colourStyles}
      />
    </div>
  );
}

function DocSidebarItem(props) {
  switch (props.item.type) {
    case "checkbox":
      return <Checkbox {...props} />;

    case "select":
      return <SelectOne {...props} />;
  }
}

function RQLLibrarySidebar({
  path,
  sidebar,
  sidebarCollapsible = true,
  onCollapse,
  isHidden,
  search,
  totalQueries,
  totalFilteredQueries,
}) {
  const [showResponsiveSidebar, setShowResponsiveSidebar] = useState(false);
  const {
    navbar: { hideOnScroll },
    hideableSidebar,
  } = useThemeConfig();
  useLockBodyScroll(showResponsiveSidebar);
  const windowSize = useWindowSize();
  useEffect(() => {
    if (windowSize === windowSizes.desktop) {
      setShowResponsiveSidebar(false);
    }
  }, [windowSize]);
  return (
    <nav
      className={clsx("navbar", "navbar--fixed-top", "rqlNavbar", {
        "navbar--dark": styles === "dark",
        "navbar--primary": styles === "primary",
      })}
    >
      <div key="marketplace-search">
        <div className={clsx(styles.webflow, "inputContainer")}>
          <input
            className={styles.input}
            type="filter"
            placeholder="Keyword Search"
            onChange={(e) => search(e.target.value)}
            autoComplete="false"
          ></input>
          <i
            title="Keyword Search"
            className={clsx("fas fa-search", styles.searchIcon)}
          ></i>
        </div>
      </div>
      {sidebar.map((item) => (
        <div className="col col--2">
          <DocSidebarItem
            key={item.label}
            item={item}
            onItemClick={(e) => {
              e.target.blur();
              setShowResponsiveSidebar(false);
            }}
            collapsible={sidebarCollapsible}
            activePath={path}
          />
        </div>
      ))}
    </nav>
  );
}

export default RQLLibrarySidebar;
